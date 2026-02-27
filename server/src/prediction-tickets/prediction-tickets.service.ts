import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionsService } from '../predictions/predictions.service';
import { UseTicketDto } from '../common/dto/payment.dto';

@Injectable()
export class PredictionTicketsService {
  constructor(
    private prisma: PrismaService,
    private predictionsService: PredictionsService,
  ) {}

  /**
   * 예측권 사용 — AI 분석 조회.
   * 해당 경주에 예측이 없으면 먼저 Gemini로 생성한 뒤 반환.
   * 같은 경주에 대해 1분 이내 재사용 불가 (regenerate 포함).
   */
  async useTicket(userId: number, dto: UseTicketDto) {
    const raceId = Number(dto.raceId);

    // 1분 쿨다운 — 같은 경주에 대해 마지막 사용 후 60초 이내 재사용 불가
    const lastUsed = await this.prisma.predictionTicket.findFirst({
      where: { userId, raceId, status: 'USED', usedAt: { not: null } },
      orderBy: { usedAt: 'desc' },
      select: { usedAt: true },
    });
    if (lastUsed?.usedAt) {
      const elapsed = Date.now() - new Date(lastUsed.usedAt).getTime();
      const COOLDOWN_MS = 60_000;
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        throw new BadRequestException(
          `${remaining}초 후 다시 예측할 수 있습니다`,
        );
      }
    }

    const ticket = await this.prisma.predictionTicket.findFirst({
      where: { userId, status: 'AVAILABLE', expiresAt: { gte: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });

    if (!ticket) throw new BadRequestException('사용 가능한 예측권이 없습니다');

    let prediction = await this.prisma.prediction.findFirst({
      where: { raceId: Number(dto.raceId), status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });

    // 예측이 없거나 regenerate=true 이면 AI로 새 예측 생성 (create만 사용 — 이전 예측 기록 유지)
    if (!prediction || dto.regenerate) {
      try {
        prediction = await this.predictionsService.generatePrediction(
          Number(dto.raceId),
        );
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const msg = err instanceof Error ? err.message : String(err);
        const isQuota =
          status === 429 ||
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('Too Many Requests');
        if (isQuota) {
          throw new BadRequestException(
            'AI 예측 생성 한도가 초과되었습니다. 잠시 후 다시 시도해 주세요.',
          );
        }
        throw err;
      }
    }

    const updated = await this.prisma.predictionTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        predictionId: prediction.id,
        raceId: Number(dto.raceId),
      },
    });

    return { ticket: updated, prediction };
  }

  async getBalance(userId: number) {
    const [available, used, expired] = await Promise.all([
      this.prisma.predictionTicket.count({
        where: { userId, status: 'AVAILABLE', expiresAt: { gte: new Date() } },
      }),
      this.prisma.predictionTicket.count({ where: { userId, status: 'USED' } }),
      this.prisma.predictionTicket.count({
        where: {
          userId,
          OR: [
            { status: 'EXPIRED' },
            { status: 'AVAILABLE', expiresAt: { lt: new Date() } },
          ],
        },
      }),
    ]);

    return { available, used, expired, total: available + used + expired };
  }

  async getHistory(userId: number, page: number = 1, limit: number = 20) {
    const [tickets, total] = await Promise.all([
      this.prisma.predictionTicket.findMany({
        where: { userId },
        include: { prediction: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.predictionTicket.count({ where: { userId } }),
    ]);

    return { tickets, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const ticket = await this.prisma.predictionTicket.findUnique({
      where: { id },
      include: { prediction: true, subscription: true },
    });
    if (!ticket) throw new NotFoundException('예측권을 찾을 수 없습니다');
    return ticket;
  }

  /** 종합 예측권 — 해당 날짜 접근 권한 확인 */
  async checkMatrixAccess(userId: number, date: string): Promise<{ hasAccess: boolean; expiresAt?: Date }> {
    const normalized = date.replace(/-/g, '').slice(0, 8);
    const ticket = await this.prisma.predictionTicket.findFirst({
      where: {
        userId,
        type: 'MATRIX',
        status: 'USED',
        matrixDate: normalized,
        expiresAt: { gte: new Date() },
      },
    });
    return { hasAccess: !!ticket, expiresAt: ticket?.expiresAt };
  }

  /** 종합 예측권 사용 — 하루치 전체 예상표 열람 */
  async useMatrixTicket(userId: number, date: string) {
    const normalized = date.replace(/-/g, '').slice(0, 8);

    const existing = await this.prisma.predictionTicket.findFirst({
      where: {
        userId,
        type: 'MATRIX',
        status: 'USED',
        matrixDate: normalized,
        expiresAt: { gte: new Date() },
      },
    });
    if (existing) {
      return { ticket: existing, alreadyUsed: true };
    }

    const ticket = await this.prisma.predictionTicket.findFirst({
      where: {
        userId,
        type: 'MATRIX',
        status: 'AVAILABLE',
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
    });

    if (!ticket) {
      throw new BadRequestException('사용 가능한 종합 예측권이 없습니다');
    }

    const updated = await this.prisma.predictionTicket.update({
      where: { id: ticket.id },
      data: { status: 'USED', usedAt: new Date(), matrixDate: normalized },
    });

    return { ticket: updated, alreadyUsed: false };
  }

  /** 종합 예측권 잔액 조회 */
  async getMatrixBalance(userId: number) {
    const available = await this.prisma.predictionTicket.count({
      where: {
        userId,
        type: 'MATRIX',
        status: 'AVAILABLE',
        expiresAt: { gte: new Date() },
      },
    });
    const used = await this.prisma.predictionTicket.count({
      where: { userId, type: 'MATRIX', status: 'USED' },
    });
    return { available, used, total: available + used };
  }

  /** 종합 예측권 개별 구매 (1,000원/장, 30일 유효) */
  async purchaseMatrixTickets(userId: number, count: number) {
    if (count < 1 || count > 10) {
      throw new BadRequestException('구매 수량은 1~10장 사이여야 합니다');
    }
    const PRICE_PER_TICKET = 1000;
    const totalPrice = PRICE_PER_TICKET * count;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const tickets = await this.prisma.$transaction(
      Array.from({ length: count }, () =>
        this.prisma.predictionTicket.create({
          data: {
            userId,
            type: 'MATRIX',
            status: 'AVAILABLE',
            expiresAt,
          },
        }),
      ),
    );

    return {
      purchased: tickets.length,
      totalPrice,
      pricePerTicket: PRICE_PER_TICKET,
      expiresAt,
      tickets,
    };
  }

  /** Admin: 사용자에게 예측권 지급 (구독/결제 없이) */
  async grantTickets(
    userId: number,
    count: number,
    expiresInDays: number = 30,
    type: 'RACE' | 'MATRIX' = 'RACE',
  ) {
    if (count < 1 || count > 100) {
      throw new BadRequestException('지급 수량은 1~100장 사이여야 합니다');
    }
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + Math.min(365, Math.max(1, expiresInDays)),
    );

    const tickets = await this.prisma.$transaction(
      Array.from({ length: count }, () =>
        this.prisma.predictionTicket.create({
          data: {
            userId,
            subscriptionId: null,
            predictionId: null,
            raceId: null,
            type,
            status: 'AVAILABLE',
            expiresAt,
          },
        }),
      ),
    );
    return { granted: tickets.length, type, tickets };
  }
}
