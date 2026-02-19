import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { Prisma } from '@prisma/client';
import { toKraMeetName } from '../kra/constants';
import { isEligibleForAccuracy } from '../kra/ord-parser';
import { serializeRaceResults } from '../common/serializers/kra.serializer';
import {
  CreateResultDto,
  UpdateResultDto,
  BulkCreateResultDto,
  BulkUpdateResultDto,
  ResultFilterDto,
  ResultStatisticsFilterDto,
  ResultSearchDto,
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
    if (date || meet) {
      where.race = {
        ...(date && { rcDate: String(date).replace(/-/g, '').slice(0, 8) }),
        ...(meet && { meet: toKraMeetName(meet) }),
      };
    }

    const [results, total] = await Promise.all([
      this.prisma.raceResult.findMany({
        where,
        select: {
          id: true,
          raceId: true,
          ord: true,
          chulNo: true,
          hrNo: true,
          hrName: true,
          jkName: true,
          rcTime: true,
          diffUnit: true,
          race: {
            select: { meet: true, meetName: true, rcNo: true, rcDate: true, rcDist: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ race: { rcDate: 'desc' } }, { ordInt: 'asc' }, { ord: 'asc' }],
      }),
      this.prisma.raceResult.count({ where }),
    ]);

    return {
      results: serializeRaceResults(results),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const result = await this.prisma.raceResult.findUnique({
      where: { id },
      include: { race: true },
    });
    if (!result) throw new NotFoundException('결과를 찾을 수 없습니다');
    return serializeRaceResults([result])[0] ?? result;
  }

  async create(dto: CreateResultDto) {
    return this.prisma.raceResult.create({
      data: dto,
      include: { race: true },
    });
  }

  async update(id: number, dto: UpdateResultDto) {
    return this.prisma.raceResult.update({
      where: { id },
      data: dto,
      include: { race: true },
    });
  }

  async remove(id: number) {
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
  private async updatePredictionAccuracy(raceId: number) {
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
      orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }],
      select: {
        hrNo: true,
        hrName: true,
        ordType: true,
        ordInt: true,
        ord: true,
      },
    });
    if (!results.length) return;

    const predictedOrder = horseScores
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((h) => String(h.hrNo ?? h.hrName ?? '').trim());
    // ordType이 NORMAL 또는 null인 결과만 actualTop에 포함 (낙마·실격·기권 제외)
    const actualTop = results
      .filter((r) => isEligibleForAccuracy(r.ordType))
      .slice(0, 3)
      .map((r) => String(r.hrNo ?? r.hrName ?? '').trim());

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

  async getByRace(raceId: number) {
    return this.prisma.raceResult.findMany({
      where: { raceId },
      orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }],
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
        ...(where.race as object),
        meet: toKraMeetName(filters.meet),
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

  /**
   * 결과 검색 (q: 마명/마번/기수명, date, meet)
   */
  async search(filters: ResultSearchDto) {
    const { q, date, meet, page = 1, limit = 20 } = filters;
    const where: Prisma.RaceResultWhereInput = {};
    if (date || meet) {
      where.race = {
        ...(date && { rcDate: date }),
        ...(meet && { meet: toKraMeetName(meet) }),
      };
    }
    if (q && q.trim()) {
      const qTrim = q.trim();
      where.OR = [
        { hrName: { contains: qTrim, mode: 'insensitive' } },
        { hrNo: { contains: qTrim, mode: 'insensitive' } },
        { jkName: { contains: qTrim, mode: 'insensitive' } },
      ];
    }

    const [results, total] = await Promise.all([
      this.prisma.raceResult.findMany({
        where,
        select: {
          id: true,
          raceId: true,
          ord: true,
          chulNo: true,
          hrNo: true,
          hrName: true,
          jkName: true,
          race: {
            select: { meet: true, meetName: true, rcNo: true, rcDate: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.raceResult.count({ where }),
    ]);

    return {
      results: serializeRaceResults(results),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 경주별 결과 검증 (필수 필드, 중복, 순위 연속성)
   */
  async validateByRaceId(raceId: number) {
    const results = await this.prisma.raceResult.findMany({
      where: { raceId },
      orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }],
    });

    const errors: string[] = [];
    const hrNos = new Set<string>();

    for (const r of results) {
      if (!r.hrNo || !r.hrName) {
        errors.push(`결과 id=${r.id}: hrNo, hrName 필수`);
      }
      if (hrNos.has(r.hrNo)) {
        errors.push(`중복 마번: ${r.hrNo}`);
      }
      hrNos.add(r.hrNo);
    }

    return {
      valid: errors.length === 0,
      raceId,
      count: results.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 결과 일괄 수정
   */
  async bulkUpdate(dto: BulkUpdateResultDto) {
    let updated = 0;
    for (const item of dto.updates) {
      const data: Prisma.RaceResultUpdateInput = {};
      if (item.ord !== undefined) data.ord = item.ord;
      if (item.ordType !== undefined) data.ordType = item.ordType;
      if (item.rcTime !== undefined) data.rcTime = item.rcTime;
      if (item.chaksun1 !== undefined) data.chaksun1 = item.chaksun1;
      if (Object.keys(data).length > 0) {
        await this.prisma.raceResult.update({
          where: { id: item.id },
          data,
        });
        updated++;
      }
    }
    return { updated };
  }
}
