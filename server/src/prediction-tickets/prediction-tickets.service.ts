import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { Race } from '../database/entities/race.entity';
import {
  TicketStatus,
  TicketType,
  PredictionStatus,
} from '../database/db-enums';
import {
  PredictionsService,
  PredictionInProgressException,
} from '../predictions/predictions.service';
import { KraService } from '../kra/kra.service';
import { GlobalConfigService } from '../config/config.service';
import { UseTicketDto } from '../common/dto/payment.dto';

export type UseTicketResult =
  | { status: 'LINKED'; ticket: PredictionTicket; prediction: Prediction }
  | { status: 'PREPARING'; retryAfterSeconds: number; ticket: null; prediction: null };

@Injectable()
export class PredictionTicketsService {
  private readonly logger = new Logger(PredictionTicketsService.name);

  constructor(
    @InjectRepository(PredictionTicket)
    private readonly ticketRepo: Repository<PredictionTicket>,
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @InjectRepository(Race)
    private readonly raceRepo: Repository<Race>,
    private readonly dataSource: DataSource,
    private readonly predictionsService: PredictionsService,
    private readonly kraService: KraService,
    private readonly globalConfig: GlobalConfigService,
  ) {}

  async useTicket(userId: number, dto: UseTicketDto): Promise<UseTicketResult> {
    const raceId = Number(dto.raceId);
    const lastUsed = await this.ticketRepo.findOne({
      where: { userId, raceId, status: TicketStatus.USED },
      select: ['usedAt'],
      order: { usedAt: 'DESC' },
    });
    if (lastUsed?.usedAt) {
      const elapsed = Date.now() - new Date(lastUsed.usedAt).getTime();
      if (elapsed < 60_000) {
        throw new BadRequestException(
          `${Math.ceil((60_000 - elapsed) / 1000)}초 후 다시 예측할 수 있습니다`,
        );
      }
    }

    const now = new Date();
    const ticketToUse = await this.ticketRepo
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .andWhere('t.status = :status', { status: TicketStatus.AVAILABLE })
      .andWhere('t.expiresAt >= :now', { now })
      .orderBy('t.expiresAt', 'ASC')
      .limit(1)
      .getOne();
    if (!ticketToUse)
      throw new BadRequestException('사용 가능한 예측권이 없습니다');

    // Individual prediction: refresh KRA data for real-time analysis, then generate fresh.
    // This ensures the user gets the latest horse weight, weather, track info.
    const race = await this.raceRepo.findOne({
      where: { id: raceId },
      select: ['id', 'rcDate', 'meet'],
    });
    if (!race) throw new BadRequestException('경주를 찾을 수 없습니다');

    // Refresh latest KRA data (horse weight, weather, equipment, cancellations)
    try {
      await this.kraService.refreshRaceDayRealtime(race.rcDate);
      this.logger.log(
        `[useTicket] Refreshed KRA real-time data for date=${race.rcDate}`,
      );
    } catch (err: unknown) {
      // Non-fatal: proceed with existing data if refresh fails
      this.logger.warn(
        `[useTicket] KRA refresh failed (proceeding with existing data): ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Generate real-time prediction with short-TTL cache (5 min).
    // If another user just generated a prediction for the same race with the same entries,
    // reuse it instead of making a redundant Gemini call.
    const REALTIME_CACHE_TTL_MS = 5 * 60 * 1000;
    let pred: Prediction;
    try {
      // Check for a recent realtime prediction (same race, completed within TTL)
      const recentPred = dto.regenerate
        ? null
        : await this.predictionRepo
            .createQueryBuilder('p')
            .where('p.raceId = :raceId', { raceId })
            .andWhere('p.status = :status', { status: PredictionStatus.COMPLETED })
            .andWhere('p.createdAt > :cutoff', {
              cutoff: new Date(Date.now() - REALTIME_CACHE_TTL_MS),
            })
            .orderBy('p.createdAt', 'DESC')
            .getOne();

      if (recentPred) {
        this.logger.log(
          `[useTicket] Reusing recent prediction id=${recentPred.id} (${Math.round((Date.now() - new Date(recentPred.createdAt).getTime()) / 1000)}s old)`,
        );
        pred = recentPred;
      } else {
        pred = await this.predictionsService.generatePrediction(raceId, {
          skipCache: true,
          realtime: true,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('429') ||
        msg.includes('quota') ||
        msg.includes('Too Many Requests')
      ) {
        throw new BadRequestException(
          'AI 예측 생성 한도가 초과되었습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
      // If another process is generating, return PREPARING
      if (err instanceof PredictionInProgressException) {
        return {
          status: 'PREPARING' as const,
          retryAfterSeconds: 30,
          ticket: null,
          prediction: null,
        };
      }
      throw err;
    }
    await this.ticketRepo.update(ticketToUse.id, {
      status: TicketStatus.USED,
      usedAt: now,
      predictionId: pred.id,
      raceId,
    });
    const updated = await this.ticketRepo.findOne({
      where: { id: ticketToUse.id },
    });
    return { status: 'LINKED', ticket: updated!, prediction: pred };
  }

  async getBalance(userId: number) {
    const now = new Date();
    const [availCount, usedCount, expiredCount] = await Promise.all([
      this.ticketRepo
        .createQueryBuilder('t')
        .where('t.userId = :userId', { userId })
        .andWhere('t.type = :type', { type: TicketType.RACE })
        .andWhere('t.status = :status', { status: TicketStatus.AVAILABLE })
        .andWhere('t.expiresAt >= :now', { now })
        .getCount(),
      this.ticketRepo.count({
        where: { userId, type: TicketType.RACE, status: TicketStatus.USED },
      }),
      this.ticketRepo
        .createQueryBuilder('t')
        .where('t.userId = :userId', { userId })
        .andWhere('t.type = :type', { type: TicketType.RACE })
        .andWhere(
          '(t.status = :expired OR (t.status = :avail AND t.expiresAt < :now))',
          {
            expired: TicketStatus.EXPIRED,
            avail: TicketStatus.AVAILABLE,
            now,
          },
        )
        .getCount(),
    ]);
    return {
      available: availCount,
      used: usedCount,
      expired: expiredCount,
      total: availCount + usedCount + expiredCount,
    };
  }

  async getHistory(userId: number, page: number = 1, limit: number = 20) {
    const [tickets, total] = await Promise.all([
      this.ticketRepo.find({
        where: { userId },
        order: { issuedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.ticketRepo.count({ where: { userId } }),
    ]);
    return {
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyPredictionsHistory(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    const whereOpts = {
      userId,
      status: TicketStatus.USED,
      type: TicketType.RACE,
      predictionId: Not(IsNull()),
    };
    const items = await this.ticketRepo.find({
      where: whereOpts,
      relations: ['prediction', 'prediction.race', 'race'],
      order: { usedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await this.ticketRepo.count({ where: whereOpts });
    const list = items.map((t) => {
      const race = t.race ?? t.prediction?.race;
      return {
        ticketId: t.id,
        usedAt: t.usedAt,
        raceId: t.raceId ?? t.prediction?.raceId,
        predictionId: t.predictionId,
        accuracy: t.prediction?.accuracy ?? null,
        race: race
          ? {
              id: race.id,
              meet: race.meet,
              rcDate: race.rcDate,
              rcNo: race.rcNo,
              rcName: race.rcName,
            }
          : undefined,
      };
    });
    return { list, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('예측권을 찾을 수 없습니다');
    return ticket;
  }

  async checkMatrixAccess(
    userId: number,
    date: string,
  ): Promise<{ hasAccess: boolean; expiresAt?: Date }> {
    const normalized = date.replace(/-/g, '').slice(0, 8);
    const now = new Date();
    const ticket = await this.ticketRepo
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TicketType.MATRIX })
      .andWhere('t.status = :status', { status: TicketStatus.USED })
      .andWhere('t.matrixDate = :normalized', { normalized })
      .andWhere('t.expiresAt >= :now', { now })
      .select(['t.expiresAt'])
      .limit(1)
      .getOne();
    if (!ticket) return { hasAccess: false };
    return { hasAccess: true, expiresAt: ticket.expiresAt };
  }

  async useMatrixTicket(userId: number, date: string) {
    const normalized = date.replace(/-/g, '').slice(0, 8);
    const now = new Date();
    const existing = await this.ticketRepo.findOne({
      where: {
        userId,
        type: TicketType.MATRIX,
        status: TicketStatus.USED,
        matrixDate: normalized,
      },
    });
    if (existing && existing.expiresAt >= now) {
      const t = await this.ticketRepo.findOne({ where: { id: existing.id } });
      return { ticket: t, alreadyUsed: true };
    }

    const availQb = this.ticketRepo
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TicketType.MATRIX })
      .andWhere('t.status = :status', { status: TicketStatus.AVAILABLE })
      .andWhere('t.expiresAt >= :now', { now })
      .orderBy('t.expiresAt', 'ASC')
      .limit(1);
    const ticketEntity = await availQb.getOne();
    if (!ticketEntity)
      throw new BadRequestException('사용 가능한 종합 예측권이 없습니다');

    await this.ticketRepo.update(ticketEntity.id, {
      status: TicketStatus.USED,
      usedAt: now,
      matrixDate: normalized,
    });
    const updated = await this.ticketRepo.findOne({
      where: { id: ticketEntity.id },
    });
    return { ticket: updated, alreadyUsed: false };
  }

  async getMatrixBalance(userId: number) {
    const now = new Date();
    const [availCount, usedCount] = await Promise.all([
      this.ticketRepo
        .createQueryBuilder('t')
        .where('t.userId = :userId', { userId })
        .andWhere('t.type = :type', { type: TicketType.MATRIX })
        .andWhere('t.status = :status', { status: TicketStatus.AVAILABLE })
        .andWhere('t.expiresAt >= :now', { now })
        .getCount(),
      this.ticketRepo.count({
        where: { userId, type: TicketType.MATRIX, status: TicketStatus.USED },
      }),
    ]);
    return {
      available: availCount,
      used: usedCount,
      total: availCount + usedCount,
    };
  }

  async purchaseMatrixTickets(userId: number, count: number) {
    if (count < 1 || count > 10) {
      throw new BadRequestException('구매 수량은 1~10장 사이여야 합니다');
    }
    const PRICE_PER_TICKET = parseInt(await this.globalConfig.get('matrix_ticket_price') ?? '1000', 10);
    const totalPrice = PRICE_PER_TICKET * count;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const tickets = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PredictionTicket);
      const entities = Array.from({ length: count }, () =>
        repo.create({
          userId,
          type: TicketType.MATRIX,
          status: TicketStatus.AVAILABLE,
          expiresAt,
          issuedAt: new Date(),
        }),
      );
      return repo.save(entities);
    });

    return {
      purchased: tickets.length,
      totalPrice,
      pricePerTicket: PRICE_PER_TICKET,
      expiresAt,
      tickets: tickets.map((t) => ({ id: t.id })),
    };
  }

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
    const ticketType = type === 'MATRIX' ? TicketType.MATRIX : TicketType.RACE;
    const entities = Array.from({ length: count }, () =>
      this.ticketRepo.create({
        userId,
        type: ticketType,
        status: TicketStatus.AVAILABLE,
        expiresAt,
        issuedAt: new Date(),
      }),
    );
    const tickets = await this.ticketRepo.save(entities);
    return {
      granted: tickets.length,
      type,
      tickets: tickets.map((t) => ({ id: t.id })),
    };
  }
}
