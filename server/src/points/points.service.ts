import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PicksService } from '../picks/picks.service';
import {
  CreatePointTransactionDto,
  PointTransferDto,
  PurchaseTicketDto,
} from './dto/point.dto';
import { PointTransactionType, PointStatus } from '@prisma/client';
import { PickType } from '@prisma/client';

const PICK_TYPE_CONFIG_KEYS: Record<PickType, string> = {
  SINGLE: 'SINGLE_MULTIPLIER',
  PLACE: 'PLACE_MULTIPLIER',
  QUINELLA: 'QUINELLA_MULTIPLIER',
  EXACTA: 'EXACTA_MULTIPLIER',
  QUINELLA_PLACE: 'QUINELLA_PLACE_MULTIPLIER',
  TRIFECTA: 'TRIFECTA_MULTIPLIER',
  TRIPLE: 'TRIPLE_MULTIPLIER',
};

@Injectable()
export class PointsService {
  constructor(
    private prisma: PrismaService,
    private picksService: PicksService,
  ) {}

  async getBalance(userId: string) {
    const transactions = await this.prisma.pointTransaction.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const totalEarned = transactions
      .filter((t) =>
        [
          'EARNED',
          'BONUS',
          'PROMOTION',
          'TRANSFER_IN',
          'ADMIN_ADJUSTMENT',
        ].includes(t.transactionType),
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = transactions
      .filter((t) =>
        ['SPENT', 'TRANSFER_OUT', 'EXPIRED'].includes(t.transactionType),
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      userId,
      currentPoints: totalEarned - totalSpent,
      totalPointsEarned: totalEarned,
      totalPointsSpent: totalSpent,
      bonusPoints: 0, // 로직 추가 필요
      expiringPoints: 0, // 로직 추가 필요
      lastUpdated: new Date(),
    };
  }

  async getTransactions(userId: string, filters: any) {
    const where: any = { userId };
    if (filters.type) where.transactionType = filters.type;
    if (filters.status) where.status = filters.status;

    const [transactions, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit || 0,
        take: filters.limit || 20,
      }),
      this.prisma.pointTransaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page: filters.page || 1,
      totalPages: Math.ceil(total / (filters.limit || 20)),
    };
  }

  async createTransaction(userId: string, dto: CreatePointTransactionDto) {
    // 잔액 확인 및 업데이트 로직 필요하나, 일단 단순 기록
    const currentBalance = (await this.getBalance(userId)).currentPoints;
    let balanceAfter = currentBalance;

    if (['SPENT', 'TRANSFER_OUT'].includes(dto.type)) {
      balanceAfter -= dto.amount;
    } else {
      balanceAfter += dto.amount;
    }

    return this.prisma.pointTransaction.create({
      data: {
        userId,
        transactionType: dto.type,
        amount: dto.amount,
        balanceAfter,
        description: dto.description,
        metadata: dto.metadata,
        status: PointStatus.ACTIVE,
      },
    });
  }

  async transfer(fromUserId: string, dto: PointTransferDto) {
    const fromBalance = await this.getBalance(fromUserId);
    if (fromBalance.currentPoints < dto.amount) {
      throw new BadRequestException('잔액이 부족합니다.');
    }

    // 트랜잭션으로 처리해야 함
    return this.prisma.$transaction(async (prisma) => {
      // 출금
      await prisma.pointTransaction.create({
        data: {
          userId: fromUserId,
          transactionType: PointTransactionType.TRANSFER_OUT,
          amount: dto.amount,
          balanceAfter: fromBalance.currentPoints - dto.amount,
          description: `Transfer to ${dto.toUserId}: ${dto.description}`,
          status: PointStatus.ACTIVE,
        },
      });

      // 입금
      const toBalance = await this.getBalance(dto.toUserId);
      await prisma.pointTransaction.create({
        data: {
          userId: dto.toUserId,
          transactionType: PointTransactionType.TRANSFER_IN,
          amount: dto.amount,
          balanceAfter: toBalance.currentPoints + dto.amount,
          description: `Transfer from ${fromUserId}: ${dto.description}`,
          status: PointStatus.ACTIVE,
        },
      });

      return { status: 'COMPLETED' };
    });
  }

  async getPromotions(_filters: any) {
    return this.prisma.pointPromotion.findMany({
      where: { isActive: true },
    });
  }

  async applyPromotion(userId: string, promotionId: string) {
    const promotion = await this.prisma.pointPromotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion || !promotion.isActive) {
      throw new NotFoundException('프로모션을 찾을 수 없거나 만료되었습니다.');
    }

    // 중복 적용 체크 등 로직 필요

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
    const price = await this.prisma.pointTicketPrice.findFirst({
      where: { isActive: true, effectiveTo: null },
      orderBy: { effectiveFrom: 'desc' },
    });
    return { pointsPerTicket: price?.pointsPerTicket ?? 1200 };
  }

  async purchaseTicket(userId: string, dto: PurchaseTicketDto) {
    const { pointsPerTicket } = await this.getTicketPrice();
    const totalCost = pointsPerTicket * dto.quantity;
    const balance = await this.getBalance(userId);
    if (balance.currentPoints < totalCost) {
      throw new BadRequestException(
        `포인트가 부족합니다. 필요: ${totalCost}pt, 보유: ${balance.currentPoints}pt`,
      );
    }

    const tickets: any[] = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return this.prisma.$transaction(async (tx) => {
      await tx.pointTransaction.create({
        data: {
          userId,
          transactionType: PointTransactionType.SPENT,
          amount: totalCost,
          balanceAfter: balance.currentPoints - totalCost,
          description: `예측권 ${dto.quantity}장 구매 (포인트)`,
          metadata: { quantity: dto.quantity },
          status: PointStatus.ACTIVE,
        },
      });

      for (let i = 0; i < dto.quantity; i++) {
        const ticket = await tx.predictionTicket.create({
          data: {
            userId,
            status: 'AVAILABLE',
            expiresAt,
          },
        });
        tickets.push(ticket);
      }

      const newBalance = await this.getBalance(userId);
      return {
        tickets,
        pointsSpent: totalCost,
        remainingPoints: newBalance.currentPoints,
      };
    });
  }

  /**
   * 경주 결과 확정 후, 적중한 UserPick에 포인트 지급
   */
  async awardPickPointsForRace(raceId: string): Promise<{ awarded: number }> {
    const picks = await this.prisma.userPick.findMany({
      where: { raceId },
      include: {
        race: { include: { results: { orderBy: { rcRank: 'asc' } } } },
      },
    });

    const configMap = await this.getPointConfigMap();
    const basePoints = parseInt(configMap['BASE_POINTS'] ?? '100', 10);
    let awardedCount = 0;

    for (const pick of picks) {
      if (pick.pointsAwarded != null && pick.pointsAwarded > 0) continue;
      const results = pick.race?.results ?? [];
      if (results.length === 0) continue;

      const isHit = this.picksService.checkPickHit(
        pick.pickType,
        pick.hrNos,
        results.map((r) => ({ hrNo: r.hrNo, rcRank: r.rcRank })),
      );
      if (!isHit) continue;

      const multKey = PICK_TYPE_CONFIG_KEYS[pick.pickType];
      const mult = parseFloat(configMap[multKey] ?? '1');
      const points = Math.round(basePoints * mult);

      const balance = await this.getBalance(pick.userId);
      await this.prisma.pointTransaction.create({
        data: {
          userId: pick.userId,
          transactionType: PointTransactionType.EARNED,
          amount: points,
          balanceAfter: balance.currentPoints + points,
          description: `경주 적중 보상 (${pick.pickType})`,
          metadata: { raceId, pickId: pick.id },
          status: PointStatus.ACTIVE,
        },
      });

      await this.prisma.userPick.update({
        where: { id: pick.id },
        data: { pointsAwarded: points },
      });
      awardedCount++;
    }

    return { awarded: awardedCount };
  }

  private async getPointConfigMap(): Promise<Record<string, string>> {
    const configs = await this.prisma.pointConfig.findMany();
    return Object.fromEntries(configs.map((c) => [c.configKey, c.configValue]));
  }
}
