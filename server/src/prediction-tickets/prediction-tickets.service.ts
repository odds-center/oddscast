import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UseTicketDto } from '../common/dto/payment.dto';

@Injectable()
export class PredictionTicketsService {
  constructor(private prisma: PrismaService) {}

  async useTicket(userId: number, dto: UseTicketDto) {
    const ticket = await this.prisma.predictionTicket.findFirst({
      where: { userId, status: 'AVAILABLE', expiresAt: { gte: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });

    if (!ticket) throw new BadRequestException('사용 가능한 예측권이 없습니다');

    const prediction = await this.prisma.prediction.findFirst({
      where: { raceId: Number(dto.raceId), status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!prediction) throw new NotFoundException('해당 경주의 예측이 없습니다');

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
}
