import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { Prisma } from '@prisma/client';
import {
  CreateResultDto,
  UpdateResultDto,
  BulkCreateResultDto,
  ResultFilterDto,
  ResultStatisticsFilterDto,
} from './dto/result.dto';

@Injectable()
export class ResultsService {
  constructor(
    private prisma: PrismaService,
    private pointsService: PointsService,
  ) {}

  async findAll(filters: ResultFilterDto) {
    const { page = 1, limit = 20, date, meet } = filters;
    const where: Prisma.RaceResultWhereInput = {};
    if (date) {
      where.OR = [{ rcDay: date }, { race: { rcDate: date } }];
    }
    if (meet) {
      where.race = { meet };
    }

    const [results, total] = await Promise.all([
      this.prisma.raceResult.findMany({
        where,
        include: { race: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.raceResult.count({ where }),
    ]);

    return { results, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const result = await this.prisma.raceResult.findUnique({
      where: { id },
      include: { race: true },
    });
    if (!result) throw new NotFoundException('결과를 찾을 수 없습니다');
    return result;
  }

  async create(dto: CreateResultDto) {
    return this.prisma.raceResult.create({
      data: dto,
      include: { race: true },
    });
  }

  async update(id: string, dto: UpdateResultDto) {
    return this.prisma.raceResult.update({
      where: { id },
      data: dto,
      include: { race: true },
    });
  }

  async remove(id: string) {
    await this.prisma.raceResult.delete({ where: { id } });
    return { message: '결과가 삭제되었습니다' };
  }

  async bulkCreate(dto: BulkCreateResultDto) {
    const created = await this.prisma.raceResult.createMany({
      data: dto.results,
    });
    const raceId = dto.results[0]?.raceId;
    if (raceId) {
      await this.prisma.race.update({
        where: { id: raceId },
        data: { status: 'COMPLETED' },
      });
      await this.pointsService.awardPickPointsForRace(raceId);
      await this.updatePredictionAccuracy(raceId);
    }
    return { count: created.count };
  }

  /**
   * 경주 결과 확정 시 해당 경주의 예측 정확도 계산 및 DB 저장
   */
  private async updatePredictionAccuracy(raceId: string) {
    const prediction = await this.prisma.prediction.findFirst({
      where: { raceId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!prediction?.scores) return;

    const scores = prediction.scores as {
      horseScores?: Array<{ hrName?: string; hrNo?: string; score?: number }>;
    };
    const horseScores = scores.horseScores;
    if (!horseScores?.length) return;

    const results = await this.prisma.raceResult.findMany({
      where: { raceId },
      orderBy: { rcRank: 'asc' },
    });
    if (!results.length) return;

    const predictedOrder = horseScores
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((h) => String(h.hrNo ?? h.hrName ?? '').trim());
    const actualTop = results.slice(0, 3).map((r) => String(r.hrNo ?? r.hrName ?? '').trim());

    const topN = Math.min(3, predictedOrder.length, actualTop.length);
    let matchCount = 0;
    for (let i = 0; i < topN; i++) {
      if (actualTop.includes(predictedOrder[i])) matchCount++;
    }
    const accuracy = topN > 0 ? (matchCount / topN) * 100 : 0;

    await this.prisma.prediction.update({
      where: { id: prediction.id },
      data: { accuracy },
    });
  }

  async getByRace(raceId: string) {
    return this.prisma.raceResult.findMany({
      where: { raceId },
      orderBy: { rcRank: 'asc' },
    });
  }

  async getStatistics(filters: ResultStatisticsFilterDto) {
    const where: Prisma.RaceResultWhereInput = {};
    if (filters.dateFrom && filters.dateTo) {
      where.race = {
        rcDate: { gte: filters.dateFrom, lte: filters.dateTo },
      };
    }
    if (filters.meet) {
      where.race = {
        ...where.race?.is,
        meet: filters.meet,
      };
    }

    const totalResults = await this.prisma.raceResult.count({ where });
    return { totalResults, filters };
  }

  async exportResults(format: string, _filters: ResultStatisticsFilterDto) {
    const results = await this.prisma.raceResult.findMany({
      include: { race: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { format, count: results.length, data: results };
  }
}
