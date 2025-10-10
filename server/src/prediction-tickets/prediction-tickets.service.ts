import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PredictionTicket, TicketStatus } from './entities/prediction-ticket.entity';
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
    private readonly predictionsService: PredictionsService,
  ) {}

  /**
   * 예측권 발급
   */
  async issueTickets(dto: IssueTicketDto): Promise<PredictionTicket[]> {
    const quantity = dto.quantity || 1;
    const validDays = dto.validDays || 30;

    this.logger.log(`Issuing ${quantity} tickets for user: ${dto.userId}`);

    const tickets: PredictionTicket[] = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validDays);

    for (let i = 0; i < quantity; i++) {
      const ticket = this.ticketRepo.create({
        userId: dto.userId,
        subscriptionId: dto.subscriptionId || null,
        status: TicketStatus.AVAILABLE,
        expiresAt,
      });

      tickets.push(ticket);
    }

    const saved = await this.ticketRepo.save(tickets);

    this.logger.log(
      `Issued ${saved.length} tickets for user ${dto.userId}, expires: ${expiresAt.toISOString()}`,
    );

    return saved;
  }

  /**
   * 예측권 사용 (AI 예측 요청)
   */
  async useTicket(userId: string, dto: UseTicketDto): Promise<any> {
    // 1. 사용 가능한 예측권 조회
    const ticket = await this.getAvailableTicket(userId);

    if (!ticket) {
      throw new BadRequestException(
        'No available prediction tickets. Please purchase or subscribe to get tickets.',
      );
    }

    // 2. 이미 예측이 있는지 확인 (캐싱)
    const existingPrediction = await this.predictionsService.findByRaceId(dto.raceId);

    if (existingPrediction) {
      // 기존 예측 사용 (예측권 소모하지 않음)
      this.logger.log(`Using cached prediction for race: ${dto.raceId}`);
      return {
        prediction: await this.predictionsService.findOne(existingPrediction.id),
        ticketUsed: false,
        ticket: null,
      };
    }

    // 3. AI 예측 생성
    const prediction = await this.predictionsService.generatePrediction({
      raceId: dto.raceId,
    });

    // 4. 예측권 사용 처리
    ticket.use(dto.raceId, prediction.id);
    await this.ticketRepo.save(ticket);

    this.logger.log(`Ticket ${ticket.id} used for race ${dto.raceId}`);

    return {
      prediction,
      ticketUsed: true,
      ticket: {
        id: ticket.id,
        usedAt: ticket.usedAt,
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
    offset = 0,
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
  async findBySubscription(subscriptionId: string): Promise<PredictionTicket[]> {
    return this.ticketRepo.find({
      where: { subscriptionId },
      order: { issuedAt: 'DESC' },
    });
  }
}

