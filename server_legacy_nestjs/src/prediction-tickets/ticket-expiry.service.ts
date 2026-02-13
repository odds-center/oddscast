import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PredictionTicket, TicketStatus } from './entities/prediction-ticket.entity';
import * as moment from 'moment-timezone';

/**
 * 예측권 만료 처리 서비스
 * 
 * 매일 자정 만료된 예측권 처리
 */
@Injectable()
export class TicketExpiryService {
  private readonly logger = new Logger(TicketExpiryService.name);

  constructor(
    @InjectRepository(PredictionTicket)
    private readonly ticketRepo: Repository<PredictionTicket>
  ) {}

  /**
   * 매일 자정 - 만료된 예측권 처리
   */
  @Cron('0 0 * * *', {
    name: 'expire-prediction-tickets',
    timeZone: 'Asia/Seoul',
  })
  async processExpiredTickets() {
    this.logger.log('🔄 [예측권 만료] 시작');

    const now = moment().tz('Asia/Seoul').toDate();

    // 만료된 예측권 조회
    const expiredTickets = await this.ticketRepo.find({
      where: {
        status: TicketStatus.AVAILABLE,
        expiresAt: LessThan(now),
      },
    });

    if (expiredTickets.length === 0) {
      this.logger.log('[예측권 만료] 만료 대상 없음');
      return;
    }

    this.logger.log(`[예측권 만료] ${expiredTickets.length}장 만료 처리`);

    // 만료 처리
    for (const ticket of expiredTickets) {
      ticket.expire();
    }

    await this.ticketRepo.save(expiredTickets);

    this.logger.log(`✅ [예측권 만료] 완료: ${expiredTickets.length}장`);
  }

  /**
   * 매일 오전 9시 - 만료 예정 알림 (3일 전)
   */
  @Cron('0 9 * * *', {
    name: 'notify-expiring-tickets',
    timeZone: 'Asia/Seoul',
  })
  async notifyExpiringTickets() {
    this.logger.log('🔔 [만료 예정 알림] 시작');

    const threeDaysLater = moment().tz('Asia/Seoul').add(3, 'days').toDate();
    const now = moment().tz('Asia/Seoul').toDate();

    // 3일 내 만료 예정 예측권 조회
    const expiringTickets = await this.ticketRepo
      .createQueryBuilder('ticket')
      .where('ticket.status = :status', { status: TicketStatus.AVAILABLE })
      .andWhere('ticket.expiresAt BETWEEN :now AND :threeDays', {
        now,
        threeDays: threeDaysLater,
      })
      .groupBy('ticket.userId')
      .select('ticket.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .getRawMany();

    if (expiringTickets.length === 0) {
      this.logger.log('[만료 예정 알림] 대상 없음');
      return;
    }

    this.logger.log(`[만료 예정 알림] ${expiringTickets.length}명에게 알림 발송`);

    // TODO: 알림 발송 (NotificationsService 연동)
    for (const item of expiringTickets) {
      this.logger.log(
        `📨 만료 예정 알림: ${item.userId} (${item.count}장)`
      );
    }

    this.logger.log('✅ [만료 예정 알림] 완료');
  }
}

