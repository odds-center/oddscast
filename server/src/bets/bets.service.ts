import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBetDto,
  UpdateBetDto,
  BetFilterDto,
  CreateBetSlipDto,
} from './dto/bet.dto';
import { BetStatus, BetResult } from '@prisma/client';

@Injectable()
export class BetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBetDto) {
    return this.prisma.bet.create({
      data: {
        userId,
        raceId: dto.raceId,
        betType: dto.betType,
        betName: dto.betName,
        betDescription: dto.betDescription,
        betAmount: dto.betAmount,
        selections: dto.selections as any,
        betReason: dto.betReason,
        confidenceLevel: dto.confidenceLevel,
        analysisData: dto.analysisData,
        betStatus: BetStatus.PENDING,
      },
    });
  }

  async findAll(userId: string, filters: BetFilterDto) {
    const where: any = { userId };
    if (filters.raceId) where.raceId = filters.raceId;
    if (filters.betType) where.betType = filters.betType;
    if (filters.betStatus) where.betStatus = filters.betStatus;
    if (filters.betResult) where.betResult = filters.betResult;
    if (filters.dateFrom)
      where.betTime = { ...where.betTime, gte: new Date(filters.dateFrom) };
    if (filters.dateTo)
      where.betTime = { ...where.betTime, lte: new Date(filters.dateTo) };

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        orderBy: { betTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { race: true },
      }),
      this.prisma.bet.count({ where }),
    ]);

    return { bets, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id },
      include: { race: true },
    });
    if (!bet) throw new NotFoundException('Bet not found');
    return bet;
  }

  async update(id: string, dto: UpdateBetDto) {
    return this.prisma.bet.update({
      where: { id },
      data: dto,
    });
  }

  async cancel(id: string) {
    return this.prisma.bet.update({
      where: { id },
      data: { betStatus: BetStatus.CANCELLED },
    });
  }

  async processResult(id: string, result: BetResult, actualWin?: number) {
    let status: BetStatus = BetStatus.COMPLETED;
    if (result === BetResult.WIN || result === BetResult.PARTIAL_WIN)
      status = BetStatus.WON;
    if (result === BetResult.LOSE) status = BetStatus.LOST;

    return this.prisma.bet.update({
      where: { id },
      data: {
        betResult: result,
        betStatus: status,
        actualWin,
        resultTime: new Date(),
      },
    });
  }

  async createSlip(userId: string, dto: CreateBetSlipDto) {
    // 실제로는 bets 배열을 순회하며 개별 bet을 생성하거나,
    // Slip 모델에 JSON으로 저장하고 나중에 confirm 시에 bet을 생성하는 로직일 수 있음.
    // 여기서는 Slip 모델에 저장만 함.
    const totalAmount = dto.bets.reduce((sum, b) => sum + (b.amount || 0), 0);

    return this.prisma.betSlip.create({
      data: {
        userId,
        raceId: dto.raceId,
        bets: dto.bets as any,
        totalAmount,
      },
    });
  }

  async getStatistics(userId: string) {
    const bets = await this.prisma.bet.findMany({
      where: {
        userId,
        betStatus: { in: [BetStatus.WON, BetStatus.LOST, BetStatus.COMPLETED] },
      },
    });

    const totalBets = bets.length;
    const wonBets = bets.filter((b) => b.betStatus === BetStatus.WON).length;
    const lostBets = bets.filter((b) => b.betStatus === BetStatus.LOST).length;
    const totalWinnings = bets.reduce((sum, b) => sum + (b.actualWin || 0), 0);
    const totalAmount = bets.reduce((sum, b) => sum + b.betAmount, 0);

    return {
      totalBets,
      wonBets,
      lostBets,
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
      totalWinnings,
      totalLosses: totalAmount - totalWinnings,
      roi:
        totalAmount > 0
          ? ((totalWinnings - totalAmount) / totalAmount) * 100
          : 0,
      averageBetAmount: totalBets > 0 ? totalAmount / totalBets : 0,
    };
  }
}
