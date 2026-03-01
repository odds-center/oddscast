import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { PointTransaction } from '../database/entities/point-transaction.entity';
import { PointConfig } from '../database/entities/point-config.entity';
import { PointPromotion } from '../database/entities/point-promotion.entity';
import { PointTicketPrice } from '../database/entities/point-ticket-price.entity';
import { UserPick } from '../database/entities/user-pick.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { PicksService } from '../picks/picks.service';
import {
  CreatePointTransactionDto,
  PointTransferDto,
  PurchaseTicketDto,
} from './dto/point.dto';
import {
  PointTransactionType,
  PointStatus,
  PickType,
  TicketType,
  TicketStatus,
} from '../database/db-enums';

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
  PointTransactionType.EARNED,
  PointTransactionType.BONUS,
  PointTransactionType.PROMOTION,
  PointTransactionType.REFUNDED,
  PointTransactionType.TRANSFER_IN,
  PointTransactionType.ADMIN_ADJUSTMENT,
];
const SPEND_TYPES = [
  PointTransactionType.SPENT,
  PointTransactionType.TRANSFER_OUT,
  PointTransactionType.EXPIRED,
];

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointTransaction)
    private readonly pointTransactionRepo: Repository<PointTransaction>,
    @InjectRepository(PointConfig) private readonly pointConfigRepo: Repository<PointConfig>,
    @InjectRepository(PointPromotion)
    private readonly pointPromotionRepo: Repository<PointPromotion>,
    @InjectRepository(PointTicketPrice)
    private readonly pointTicketPriceRepo: Repository<PointTicketPrice>,
    @InjectRepository(UserPick) private readonly userPickRepo: Repository<UserPick>,
    @InjectRepository(RaceResult) private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(PredictionTicket)
    private readonly predictionTicketRepo: Repository<PredictionTicket>,
    private readonly picksService: PicksService,
    private readonly dataSource: DataSource,
  ) {}

  async getBalance(userId: number) {
    const rows = await this.pointTransactionRepo.find({
      where: { userId, status: PointStatus.ACTIVE },
      select: ['transactionType', 'amount'],
    });
    const totalEarned = rows
      .filter((t) => EARN_TYPES.includes(t.transactionType))
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = rows
      .filter((t) => SPEND_TYPES.includes(t.transactionType))
      .reduce((sum, t) => sum + t.amount, 0);
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
    const where: {
      userId: number;
      transactionType?: PointTransactionType;
      status?: PointStatus;
    } = { userId };
    if (filters.type) where.transactionType = filters.type as PointTransactionType;
    if (filters.status) where.status = filters.status as PointStatus;

    const [transactions, total] = await this.pointTransactionRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTransaction(userId: number, dto: CreatePointTransactionDto) {
    const currentBalance = (await this.getBalance(userId)).currentPoints;
    let balanceAfter = currentBalance;
    if (
      dto.type === PointTransactionType.SPENT ||
      dto.type === PointTransactionType.TRANSFER_OUT
    ) {
      balanceAfter -= dto.amount;
    } else {
      balanceAfter += dto.amount;
    }
    const now = new Date();
    const tx = this.pointTransactionRepo.create({
      userId,
      transactionType: dto.type,
      amount: dto.amount,
      balanceAfter,
      description: dto.description,
      metadata: dto.metadata ?? null,
      status: PointStatus.ACTIVE,
      transactionTime: now,
    });
    return this.pointTransactionRepo.save(tx);
  }

  async transfer(fromUserId: number, dto: PointTransferDto) {
    const fromBalance = await this.getBalance(fromUserId);
    if (fromBalance.currentPoints < dto.amount) {
      throw new BadRequestException('잔액이 부족합니다.');
    }
    const toUserId = Number(dto.toUserId);

    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      await manager.save(PointTransaction, {
        userId: fromUserId,
        transactionType: PointTransactionType.TRANSFER_OUT,
        amount: dto.amount,
        balanceAfter: fromBalance.currentPoints - dto.amount,
        description: `Transfer to ${toUserId}: ${dto.description}`,
        status: PointStatus.ACTIVE,
        transactionTime: now,
        createdAt: now,
        updatedAt: now,
      });
      const toBalance = await this.getBalance(toUserId);
      await manager.save(PointTransaction, {
        userId: toUserId,
        transactionType: PointTransactionType.TRANSFER_IN,
        amount: dto.amount,
        balanceAfter: toBalance.currentPoints + dto.amount,
        description: `Transfer from ${fromUserId}: ${dto.description}`,
        status: PointStatus.ACTIVE,
        transactionTime: now,
        createdAt: now,
        updatedAt: now,
      });
    });
    return { status: 'COMPLETED' };
  }

  async getPromotions(_filters: Record<string, unknown>) {
    return this.pointPromotionRepo.find({ where: { isActive: true } });
  }

  async applyPromotion(userId: number, promotionId: number) {
    const promotion = await this.pointPromotionRepo.findOne({
      where: { id: promotionId },
    });
    if (!promotion || !promotion.isActive) {
      throw new NotFoundException('프로모션을 찾을 수 없거나 만료되었습니다.');
    }
    await this.createTransaction(userId, {
      type: PointTransactionType.PROMOTION,
      amount: promotion.points,
      description: `Promotion applied: ${promotion.name}`,
    });
    return {
      message: '프로모션이 적용되었습니다.',
      pointsEarned: promotion.points,
    };
  }

  async getExpirySettings() {
    return {
      defaultExpiryDays: 365,
      allowExtension: true,
      maxExtensionDays: 30,
    };
  }

  async getTicketPrice(): Promise<{ pointsPerTicket: number }> {
    const row = await this.pointTicketPriceRepo.findOne({
      where: { isActive: true, effectiveTo: IsNull() },
      order: { effectiveFrom: 'DESC' },
    });
    return { pointsPerTicket: row?.pointsPerTicket ?? 1200 };
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
    const now = new Date();
    const tickets: PredictionTicket[] = [];

    await this.dataSource.transaction(async (manager) => {
      const ptRepo = manager.getRepository(PointTransaction);
      await ptRepo.save(
        ptRepo.create({
          userId,
          transactionType: PointTransactionType.SPENT,
          amount: totalCost,
          balanceAfter: balance.currentPoints - totalCost,
          description: `예측권 ${dto.quantity}장 구매 (포인트)`,
          metadata: { quantity: dto.quantity },
          status: PointStatus.ACTIVE,
          transactionTime: now,
        }),
      );
      const ticketRepo = manager.getRepository(PredictionTicket);
      for (let i = 0; i < dto.quantity; i++) {
        const t = await ticketRepo.save(
          ticketRepo.create({
            userId,
            type: TicketType.RACE,
            status: TicketStatus.AVAILABLE,
            expiresAt,
            issuedAt: now,
          }),
        );
        tickets.push(t);
      }
    });

    const newBalance = await this.getBalance(userId);
    return {
      tickets,
      pointsSpent: totalCost,
      remainingPoints: newBalance.currentPoints,
    };
  }

  async awardPickPointsForRace(raceId: number): Promise<{ awarded: number }> {
    const picks = await this.userPickRepo.find({
      where: { raceId },
      select: ['id', 'userId', 'pickType', 'hrNos', 'pointsAwarded'],
    });
    const configMap = await this.getPointConfigMap();
    const basePoints = parseInt(configMap['BASE_POINTS'] ?? '100', 10);
    let awardedCount = 0;

    for (const pick of picks) {
      if (pick.pointsAwarded != null && pick.pointsAwarded > 0) continue;
      const results = await this.resultRepo.find({
        where: { raceId },
        order: { ordInt: 'ASC', ord: 'ASC' },
        select: ['hrNo', 'ord'],
      });
      if (results.length === 0) continue;
      const isHit = this.picksService.checkPickHit(
        pick.pickType,
        Array.isArray(pick.hrNos) ? pick.hrNos : [],
        results.map((r) => ({ hrNo: r.hrNo, ord: r.ord })),
      );
      if (!isHit) continue;
      const multKey = PICK_TYPE_CONFIG_KEYS[pick.pickType];
      const mult = parseFloat(configMap[multKey] ?? '1');
      const points = Math.round(basePoints * mult);
      const bal = await this.getBalance(pick.userId);
      await this.createTransaction(pick.userId, {
        type: PointTransactionType.EARNED,
        amount: points,
        description: `경주 적중 보상 (${pick.pickType})`,
        metadata: { raceId, pickId: pick.id },
      });
      await this.userPickRepo.update(pick.id, { pointsAwarded: points });
      awardedCount++;
    }
    return { awarded: awardedCount };
  }

  private async getPointConfigMap(): Promise<Record<string, string>> {
    const rows = await this.pointConfigRepo.find({
      select: ['configKey', 'configValue'],
    });
    return Object.fromEntries(rows.map((c) => [c.configKey, c.configValue]));
  }
}
