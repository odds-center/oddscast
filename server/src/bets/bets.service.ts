import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bet } from '../database/entities/bet.entity';
import { serializeItemsWithRace } from '../common/serializers/kra.serializer';
import {
  CreateBetDto,
  UpdateBetDto,
  BetFilterDto,
  CreateBetSlipDto,
} from './dto/bet.dto';
import { BetStatus, BetResult } from '../database/db-enums';

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet) private readonly betRepo: Repository<Bet>,
  ) {}

  async create(_userId: number, _dto: CreateBetDto) {
    throw new Error('Bets create: implement with TypeORM');
  }

  async findAll(userId: number, filters: BetFilterDto) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const [bets, total] = await this.betRepo.findAndCount({
      where: { userId },
      relations: ['race'],
      order: { betTime: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    const items = bets.map((b) => ({
      ...b,
      race: b.race
        ? {
            id: b.race.id,
            meet: b.race.meet,
            rcDate: b.race.rcDate,
            rcNo: b.race.rcNo,
            rcName: b.race.rcName,
          }
        : null,
    }));
    return {
      bets: serializeItemsWithRace(
        items as Parameters<typeof serializeItemsWithRace>[0],
      ),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const bet = await this.betRepo.findOne({
      where: { id },
      relations: ['race'],
    });
    if (!bet) throw new NotFoundException('Bet not found');
    const item = {
      ...bet,
      race: bet.race
        ? {
            id: bet.race.id,
            meet: bet.race.meet,
            rcDate: bet.race.rcDate,
            rcNo: bet.race.rcNo,
            rcName: bet.race.rcName,
          }
        : null,
    };
    return (
      serializeItemsWithRace([item] as Parameters<
        typeof serializeItemsWithRace
      >[0])[0] ?? item
    );
  }

  async update(_id: number, _dto: UpdateBetDto) {
    throw new Error('Bets update: implement with TypeORM');
  }

  async cancel(_id: number) {
    throw new Error('Bets cancel: implement with TypeORM');
  }

  async processResult(_id: number, _result: BetResult, _actualWin?: number) {
    throw new Error('Bets processResult: implement with TypeORM');
  }

  async createSlip(_userId: number, _dto: CreateBetSlipDto) {
    throw new Error('BetSlip create: implement with TypeORM');
  }

  async getStatistics(userId: number) {
    const rows = await this.betRepo.find({
      where: {
        userId,
        betStatus: In([BetStatus.WON, BetStatus.LOST, BetStatus.COMPLETED]),
      },
      select: ['betAmount', 'actualWin', 'betStatus'],
    });
    const totalBets = rows.length;
    const wonBets = rows.filter((r) => r.betStatus === BetStatus.WON).length;
    const lostBets = rows.filter((r) => r.betStatus === BetStatus.LOST).length;
    const totalWinnings = rows.reduce((sum, r) => sum + (r.actualWin ?? 0), 0);
    const totalAmount = rows.reduce((sum, r) => sum + r.betAmount, 0);
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
