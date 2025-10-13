import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PredictionTicket,
  TicketStatus,
} from '../../prediction-tickets/entities/prediction-ticket.entity';

/**
 * 예측권 필수 가드
 * - AI 예측 조회 시 예측권 필요
 * - 예측권 없으면 403 Forbidden
 */
@Injectable()
export class TicketRequiredGuard implements CanActivate {
  private readonly logger = new Logger(TicketRequiredGuard.name);

  constructor(
    @InjectRepository(PredictionTicket)
    private readonly ticketRepo: Repository<PredictionTicket>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const raceId = request.params.raceId;

    if (!user || !user.id) {
      throw new ForbiddenException('로그인이 필요합니다');
    }

    // 사용 가능한 예측권 확인
    const availableTicket = await this.ticketRepo.findOne({
      where: {
        userId: user.id,
        status: TicketStatus.AVAILABLE,
      },
      order: {
        expiresAt: 'ASC', // 만료 임박한 것부터
      },
    });

    if (!availableTicket) {
      this.logger.warn(`예측권 없음: User ${user.id}, Race ${raceId}`);
      throw new ForbiddenException({
        message: '예측권이 필요합니다',
        code: 'TICKET_REQUIRED',
        availableTickets: 0,
      });
    }

    // 예측권을 request에 저장
    request.ticket = availableTicket;

    return true;
  }
}
