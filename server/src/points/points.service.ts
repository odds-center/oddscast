import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PgService } from '../database/pg.service';
import { PicksService } from '../picks/picks.service';
import {
  CreatePointTransactionDto,
  PointTransferDto,
  PurchaseTicketDto,
} from './dto/point.dto';
import { PointTransactionType, PointStatus, PickType } from '../database/db-enums';

const PICK_TYPE_CONFIG_KEYS: Record<PickType, string> = {
  SINGLE: 'SINGLE_MULTIPLIER',
  PLACE: 'PLACE_MULTIPLIER',
  QUINELLA: 'QUINELLA_MULTIPLIER',
  EXACTA: 'EXACTA_MULTIPLIER',
  QUINELLA_PLACE: 'QUINELLA_PLACE_MULTIPLIER',
  TRIFECTA: 'TRIFECTA_MULTIPLIER',
  TRIPLE: 'TRIPLE_MULTIPLIER',
};

const EARN_TYPES = [
  'EARNED',
  'BONUS',
  'PROMOTION',
  'REFUNDED',
  'TRANSFER_IN',
  'ADMIN_ADJUSTMENT',
];
const SPEND_TYPES = ['SPENT', 'TRANSFER_OUT', 'EXPIRED'];

@Injectable()
export class PointsService {
  constructor(
    private readonly db: PgService,
    private readonly picksService: PicksService,
  ) {}

  async getBalance(userId: number) {
    const { rows } = await this.db.query<{ transactionType: string; amount: string }>(
      'SELECT "transactionType", amount::text AS amount FROM point_transactions WHERE "userId" = $1 AND status = $2',
      [userId, PointStatus.ACTIVE],
    );
    const totalEarned = rows
      .filter((t) => EARN_TYPES.includes(t.transactionType))
      .reduce((sum, t) => sum + parseInt(t.amount, 10), 0);
    const totalSpent = rows
      .filter((t) => SPEND_TYPES.includes(t.transactionType))
      .reduce((sum, t) => sum + parseInt(t.amount, 10), 0);
    return {
      userId,
      currentPoints: totalEarned - totalSpent,
      totalPointsEarned: totalEarned,
      totalPointsSpent: totalSpent,
      bonusPoints: 0,
      expiringPoints: 0,
      lastUpdated: new Date(),
    };
  }

  async getTransactions(
    userId: number,
    filters: { page?: number; limit?: number; type?: string; status?: string },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const conditions = ['"userId" = $1'];
    const params: unknown[] = [userId];
    if (filters.type) {
      conditions.push('"transactionType" = $' + (params.length + 1));
      params.push(filters.type);
    }
    if (filters.status) {
      conditions.push('status = $' + (params.length + 1));
      params.push(filters.status);
    }
    const where = conditions.join(' AND ');
    const [countRes, rowsRes] = await Promise.all([
      this.db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM point_transactions WHERE ${where}`,
        params,
      ),
      this.db.query(
        `SELECT * FROM point_transactions WHERE ${where} ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, (page - 1) * limit],
      ),
    ]);
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    return {
      transactions: rowsRes.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTransaction(userId: number, dto: CreatePointTransactionDto) {
    const currentBalance = (await this.getBalance(userId)).currentPoints;
    let balanceAfter = currentBalance;
    if (['SPENT', 'TRANSFER_OUT'].includes(dto.type)) {
      balanceAfter -= dto.amount;
    } else {
      balanceAfter += dto.amount;
    }
    const now = new Date();
    const { rows } = await this.db.query(
      `INSERT INTO point_transactions ("userId", "transactionType", amount, "balanceAfter", description, metadata, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING *`,
      [
        userId,
        dto.type,
        dto.amount,
        balanceAfter,
        dto.description,
        dto.metadata != null ? JSON.stringify(dto.metadata) : null,
        PointStatus.ACTIVE,
        now,
      ],
    );
    return rows[0];
  }

  async transfer(fromUserId: number, dto: PointTransferDto) {
    const fromBalance = await this.getBalance(fromUserId);
    if (fromBalance.currentPoints < dto.amount) {
      throw new BadRequestException('잔액이 부족합니다.');
    }
    const toUserId = Number(dto.toUserId);
    const client = await this.db.getClient();
    if (client) {
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO point_transactions ("userId", "transactionType", amount, "balanceAfter", description, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
          [
            fromUserId,
            PointTransactionType.TRANSFER_OUT,
            dto.amount,
            fromBalance.currentPoints - dto.amount,
            `Transfer to ${toUserId}: ${dto.description}`,
            PointStatus.ACTIVE,
            new Date(),
          ],
        );
        const toBalance = await this.getBalance(toUserId);
        await client.query(
          `INSERT INTO point_transactions ("userId", "transactionType", amount, "balanceAfter", description, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
          [
            toUserId,
            PointTransactionType.TRANSFER_IN,
            dto.amount,
            toBalance.currentPoints + dto.amount,
            `Transfer from ${fromUserId}: ${dto.description}`,
            PointStatus.ACTIVE,
            new Date(),
          ],
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
    return { status: 'COMPLETED' };
  }

  async getPromotions(_filters: Record<string, unknown>) {
    const { rows } = await this.db.query(
      'SELECT * FROM point_promotions WHERE "isActive" = true',
      [],
    );
    return rows;
  }

  async applyPromotion(userId: number, promotionId: number) {
    const { rows } = await this.db.query(
      'SELECT * FROM point_promotions WHERE id = $1',
      [promotionId],
    );
    const promotion = rows[0] as { isActive: boolean; points: number; name: string } | undefined;
    if (!promotion || !promotion.isActive) {
      throw new NotFoundException('프로모션을 찾을 수 없거나 만료되었습니다.');
    }
    await this.createTransaction(userId, {
      type: PointTransactionType.PROMOTION,
      amount: promotion.points,
      description: `Promotion applied: ${promotion.name}`,
    });
    return { message: '프로모션이 적용되었습니다.', pointsEarned: promotion.points };
  }

  async getExpirySettings() {
    return {
      defaultExpiryDays: 365,
      allowExtension: true,
      maxExtensionDays: 30,
    };
  }

  async getTicketPrice(): Promise<{ pointsPerTicket: number }> {
    const { rows } = await this.db.query<{ pointsPerTicket: string }>(
      'SELECT "pointsPerTicket"::text FROM point_ticket_prices WHERE "isActive" = true AND "effectiveTo" IS NULL ORDER BY "effectiveFrom" DESC LIMIT 1',
      [],
    );
    const price = rows[0];
    return { pointsPerTicket: price ? parseInt(price.pointsPerTicket, 10) : 1200 };
  }

  async purchaseTicket(userId: number, dto: PurchaseTicketDto) {
    const { pointsPerTicket } = await this.getTicketPrice();
    const totalCost = pointsPerTicket * dto.quantity;
    const balance = await this.getBalance(userId);
    if (balance.currentPoints < totalCost) {
      throw new BadRequestException(
        `포인트가 부족합니다. 필요: ${totalCost}pt, 보유: ${balance.currentPoints}pt`,
      );
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const client = await this.db.getClient();
    const tickets: Record<string, unknown>[] = [];
    if (client) {
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO point_transactions ("userId", "transactionType", amount, "balanceAfter", description, metadata, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
          [
            userId,
            PointTransactionType.SPENT,
            totalCost,
            balance.currentPoints - totalCost,
            `예측권 ${dto.quantity}장 구매 (포인트)`,
            JSON.stringify({ quantity: dto.quantity }),
            PointStatus.ACTIVE,
            new Date(),
          ],
        );
        for (let i = 0; i < dto.quantity; i++) {
          const r = await client.query(
            `INSERT INTO prediction_tickets ("userId", type, status, "expiresAt") VALUES ($1, 'RACE', 'AVAILABLE', $2) RETURNING *`,
            [userId, expiresAt],
          );
          if (r.rows[0]) tickets.push(r.rows[0]);
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
    const newBalance = await this.getBalance(userId);
    return { tickets, pointsSpent: totalCost, remainingPoints: newBalance.currentPoints };
  }

  async awardPickPointsForRace(raceId: number): Promise<{ awarded: number }> {
    const { rows: picks } = await this.db.query<{
      id: number;
      userId: number;
      pickType: string;
      hrNos: string[];
      pointsAwarded: number | null;
    }>('SELECT id, "userId", "pickType", "hrNos", "pointsAwarded" FROM user_picks WHERE "raceId" = $1', [
      raceId,
    ]);
    const configMap = await this.getPointConfigMap();
    const basePoints = parseInt(configMap['BASE_POINTS'] ?? '100', 10);
    let awardedCount = 0;

    for (const pick of picks) {
      if (pick.pointsAwarded != null && pick.pointsAwarded > 0) continue;
      const resRes = await this.db.query<{ hrNo: string; ord: string | null }>(
        'SELECT "hrNo", ord FROM race_results WHERE "raceId" = $1 ORDER BY "ordInt" ASC, ord ASC',
        [raceId],
      );
      const results = resRes.rows;
      if (results.length === 0) continue;
      const isHit = this.picksService.checkPickHit(
        pick.pickType as PickType,
        Array.isArray(pick.hrNos) ? pick.hrNos : [],
        results,
      );
      if (!isHit) continue;
      const multKey = PICK_TYPE_CONFIG_KEYS[pick.pickType as PickType];
      const mult = parseFloat(configMap[multKey] ?? '1');
      const points = Math.round(basePoints * mult);
      const bal = await this.getBalance(pick.userId);
      const now = new Date();
      await this.db.query(
        `INSERT INTO point_transactions ("userId", "transactionType", amount, "balanceAfter", description, metadata, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
        [
          pick.userId,
          PointTransactionType.EARNED,
          points,
          bal.currentPoints + points,
          `경주 적중 보상 (${pick.pickType})`,
          JSON.stringify({ raceId, pickId: pick.id }),
          PointStatus.ACTIVE,
          now,
        ],
      );
      await this.db.query('UPDATE user_picks SET "pointsAwarded" = $1 WHERE id = $2', [
        points,
        pick.id,
      ]);
      awardedCount++;
    }
    return { awarded: awardedCount };
  }

  private async getPointConfigMap(): Promise<Record<string, string>> {
    const { rows } = await this.db.query<{ configKey: string; configValue: string }>(
      'SELECT "configKey", "configValue" FROM point_configs',
      [],
    );
    return Object.fromEntries(rows.map((c) => [c.configKey, c.configValue]));
  }
}
