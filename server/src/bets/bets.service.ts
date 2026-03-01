import { Injectable, NotFoundException } from '@nestjs/common';
import { PgService } from '../database/pg.service';
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
  constructor(private readonly db: PgService) {}

  async create(_userId: number, _dto: CreateBetDto) {
    throw new Error('Bets create: implement with PgService raw SQL');
  }

  async findAll(userId: number, filters: BetFilterDto) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const { rows } = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM bets WHERE "userId" = $1',
      [userId],
    );
    const total = parseInt(rows[0]?.count ?? '0', 10);
    const { rows: bets } = await this.db.query(
      'SELECT b.*, r.id AS "race_id", r.meet, r."rcDate", r."rcNo", r."rcName" FROM bets b LEFT JOIN races r ON r.id = b."raceId" WHERE b."userId" = $1 ORDER BY b."betTime" DESC LIMIT $2 OFFSET $3',
      [userId, limit, (page - 1) * limit],
    );
    const withRace = bets.map((b: Record<string, unknown>) => ({
      ...b,
      race: b.race_id != null ? { id: b.race_id, meet: b.meet, rcDate: b.rcDate, rcNo: b.rcNo, rcName: b.rcName } : null,
    }));
    return {
      bets: serializeItemsWithRace(withRace as Parameters<typeof serializeItemsWithRace>[0]),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const { rows } = await this.db.query(
      'SELECT b.*, r.id AS "race_id", r.meet, r."rcDate", r."rcNo", r."rcName" FROM bets b LEFT JOIN races r ON r.id = b."raceId" WHERE b.id = $1',
      [id],
    );
    const bet = rows[0] as Record<string, unknown> | undefined;
    if (!bet) throw new NotFoundException('Bet not found');
    const withRace = { ...bet, race: bet.race_id != null ? { id: bet.race_id, meet: bet.meet, rcDate: bet.rcDate, rcNo: bet.rcNo, rcName: bet.rcName } : null };
    return serializeItemsWithRace([withRace] as Parameters<typeof serializeItemsWithRace>[0])[0] ?? withRace;
  }

  async update(_id: number, _dto: UpdateBetDto) {
    throw new Error('Bets update: implement with PgService raw SQL');
  }

  async cancel(_id: number) {
    throw new Error('Bets cancel: implement with PgService raw SQL');
  }

  async processResult(_id: number, _result: BetResult, _actualWin?: number) {
    throw new Error('Bets processResult: implement with PgService raw SQL');
  }

  async createSlip(_userId: number, _dto: CreateBetSlipDto) {
    throw new Error('BetSlip create: implement with PgService raw SQL');
  }

  async getStatistics(userId: number) {
    const { rows } = await this.db.query<{ betAmount: string; actualWin: string | null; betStatus: string }>(
      `SELECT "betAmount", "actualWin", "betStatus" FROM bets WHERE "userId" = $1 AND "betStatus" IN ('WON', 'LOST', 'COMPLETED')`,
      [userId],
    );
    const totalBets = rows.length;
    const wonBets = rows.filter((r) => r.betStatus === BetStatus.WON).length;
    const lostBets = rows.filter((r) => r.betStatus === BetStatus.LOST).length;
    const totalWinnings = rows.reduce((sum, r) => sum + parseFloat(r.actualWin ?? '0'), 0);
    const totalAmount = rows.reduce((sum, r) => sum + parseFloat(r.betAmount), 0);
    return {
      totalBets,
      wonBets,
      lostBets,
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
      totalWinnings,
      totalLosses: totalAmount - totalWinnings,
      roi: totalAmount > 0 ? ((totalWinnings - totalAmount) / totalAmount) * 100 : 0,
      averageBetAmount: totalBets > 0 ? totalAmount / totalBets : 0,
    };
  }
}
