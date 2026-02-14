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
   */
  async useTicket(userId: number, dto: UseTicketDto) {
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
      prediction = await this.predictionsService.generatePrediction(
        Number(dto.raceId),
      );
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

  /** Admin: 사용자에게 예측권 지급 (구독/결제 없이) */
  async grantTickets(
    userId: number,
    count: number,
    expiresInDays: number = 30,
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
            status: 'AVAILABLE',
            expiresAt,
          },
        }),
      ),
    );
    return { granted: tickets.length, tickets };
  }
}
