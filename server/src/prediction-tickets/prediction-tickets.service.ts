import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  PredictionTicket,
  TicketStatus,
} from './entities/prediction-ticket.entity';
import { PredictionsService } from '../predictions/predictions.service';
import { IssueTicketDto, UseTicketDto, TicketBalanceDto } from './dto';

/**
 * 예측권 서비스
 */
@Injectable()
export class PredictionTicketsService {
  private readonly logger = new Logger(PredictionTicketsService.name);

  constructor(
    @InjectRepository(PredictionTicket)
    private readonly ticketRepo: Repository<PredictionTicket>,
    @Inject(forwardRef(() => PredictionsService))
    private readonly predictionsService: PredictionsService
  ) {}

  /**
   * 예측권 발급
   */
  async issueTickets(dto: IssueTicketDto): Promise<PredictionTicket[]> {
    const quantity = dto.quantity || 1;
    const validDays = dto.validDays || 30;
    const source = dto.source || 'subscription';

    this.logger.log(
      `Issuing ${quantity} tickets for user: ${dto.userId} (source: ${source})`
    );

    const tickets: PredictionTicket[] = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validDays);

    for (let i = 0; i < quantity; i++) {
      const ticket = this.ticketRepo.create({
        userId: dto.userId,
        subscriptionId: dto.subscriptionId || null,
        source,
        status: TicketStatus.AVAILABLE,
        expiresAt,
      });

      tickets.push(ticket);
    }

    const saved = await this.ticketRepo.save(tickets);

    this.logger.log(
      `Issued ${saved.length} tickets for user ${dto.userId}, expires: ${expiresAt.toISOString()}`
    );

    return saved;
  }

  /**
   * 예측권 사용 (AI 예측 열람)
   * 
   * ✅ 올바른 개념:
   * - AI 예측은 배치로 미리 생성됨
   * - 예측권은 "열람 권한"
   * - 예측이 있든 없든 예측권 소비
   */
  async useTicket(userId: string, dto: UseTicketDto): Promise<any> {
    // 1. 사용 가능한 예측권 조회
    const ticket = await this.getAvailableTicket(userId);

    if (!ticket) {
      throw new BadRequestException(
        '사용 가능한 예측권이 없습니다. 구독 또는 개별 구매를 통해 예측권을 획득하세요.'
      );
    }

    // 2. AI 예측 확인 (배치로 미리 생성되어 있어야 함)
    const existingPrediction = await this.predictionsService.findByRaceId(
      dto.raceId
    );

    if (!existingPrediction) {
      // 예측이 없으면 에러 (배치 작업에서 생성되어야 함)
      throw new NotFoundException(
        '해당 경주에 대한 AI 예측이 아직 생성되지 않았습니다. 잠시 후 다시 시도해주세요.'
      );
    }

    // 3. 예측권 사용 처리 (열람 권한 소비)
    ticket.use(dto.raceId, existingPrediction.id);
    await this.ticketRepo.save(ticket);

    this.logger.log(
      `예측권 사용: ${ticket.id} → Race ${dto.raceId} (Prediction ${existingPrediction.id})`
    );

    // 4. AI 예측 결과 반환
    const predictionDetail = await this.predictionsService.findOne(
      existingPrediction.id
    );

    return {
      prediction: predictionDetail,
      ticketUsed: true,
      ticket: {
        id: ticket.id,
        usedAt: ticket.usedAt,
        expiresAt: ticket.expiresAt,
      },
    };
  }

  /**
   * 사용 가능한 예측권 조회 (1개)
   */
  async getAvailableTicket(userId: string): Promise<PredictionTicket | null> {
    const ticket = await this.ticketRepo.findOne({
      where: {
        userId,
        status: TicketStatus.AVAILABLE,
      },
      order: {
        expiresAt: 'ASC', // 만료일이 가까운 것부터 사용
      },
    });

    // 만료 확인
    if (ticket && !ticket.isAvailable()) {
      ticket.expire();
      await this.ticketRepo.save(ticket);
      return null;
    }

    return ticket;
  }

  /**
   * 예측권 잔액 조회
   */
  async getBalance(userId: string): Promise<TicketBalanceDto> {
    const [available, used, expired, total] = await Promise.all([
      this.ticketRepo.count({
        where: { userId, status: TicketStatus.AVAILABLE },
      }),
      this.ticketRepo.count({
        where: { userId, status: TicketStatus.USED },
      }),
      this.ticketRepo.count({
        where: { userId, status: TicketStatus.EXPIRED },
      }),
      this.ticketRepo.count({ where: { userId } }),
    ]);

    return {
      userId,
      availableTickets: available,
      usedTickets: used,
      expiredTickets: expired,
      totalTickets: total,
    };
  }

  /**
   * 사용 내역 조회
   */
  async getHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<PredictionTicket[]> {
    return this.ticketRepo.find({
      where: { userId },
      order: { issuedAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['prediction'],
    });
  }

  /**
   * 예측권 상세 조회
   */
  async findOne(id: string): Promise<PredictionTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['prediction', 'user'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket not found: ${id}`);
    }

    return ticket;
  }

  /**
   * 만료된 예측권 처리 (배치 작업)
   */
  async expireTickets(): Promise<number> {
    const now = new Date();

    const expiredTickets = await this.ticketRepo.find({
      where: {
        status: TicketStatus.AVAILABLE,
        expiresAt: LessThan(now),
      },
    });

    for (const ticket of expiredTickets) {
      ticket.expire();
    }

    if (expiredTickets.length > 0) {
      await this.ticketRepo.save(expiredTickets);
      this.logger.log(`Expired ${expiredTickets.length} tickets`);
    }

    return expiredTickets.length;
  }

  /**
   * 사용자의 모든 예측권 조회
   */
  async findAllByUser(userId: string): Promise<PredictionTicket[]> {
    return this.ticketRepo.find({
      where: { userId },
      order: { issuedAt: 'DESC' },
    });
  }

  /**
   * 구독으로 발급된 예측권 조회
   */
  async findBySubscription(
    subscriptionId: string
  ): Promise<PredictionTicket[]> {
    return this.ticketRepo.find({
      where: { subscriptionId },
      order: { issuedAt: 'DESC' },
    });
  }

  /**
   * 만료 예정 예측권 조회 (알림용)
   */
  async findExpiringTickets(days: number): Promise<PredictionTicket[]> {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return this.ticketRepo.find({
      where: {
        status: TicketStatus.AVAILABLE,
      },
      order: { expiresAt: 'ASC' },
    });
  }
}
