import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { User } from '../database/entities/user.entity';
import { Race } from '../database/entities/race.entity';
import { SinglePurchase } from '../database/entities/single-purchase.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { BatchSchedule } from '../database/entities/batch-schedule.entity';
import {
  BatchScheduleStatus,
  PredictionStatus,
  SubscriptionStatus,
  TicketStatus,
} from '../database/db-enums';
import { todayKstYyyymmdd, kst, dateToKstDash } from '../common/utils/kst';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(KraSyncLog)
    private readonly kraSyncLogRepo: Repository<KraSyncLog>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(SinglePurchase)
    private readonly singlePurchaseRepo: Repository<SinglePurchase>,
    @InjectRepository(PredictionTicket)
    private readonly predictionTicketRepo: Repository<PredictionTicket>,
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @InjectRepository(BatchSchedule)
    private readonly batchScheduleRepo: Repository<BatchSchedule>,
  ) {}

  async getKraSyncLogs(endpoint?: string, rcDate?: string, limit = 50) {
    const take = Math.min(Number(limit) || 50, 100);
    const where: { endpoint?: string; rcDate?: string } = {};
    if (endpoint) where.endpoint = endpoint;
    if (rcDate) where.rcDate = rcDate;
    const logs = await this.kraSyncLogRepo.find({
      where: Object.keys(where).length ? where : undefined,
      order: { createdAt: 'DESC' },
      take,
    });
    return { logs, total: logs.length };
  }

  async getSubscriptionPlanById(id: number) {
    return this.planRepo.findOne({ where: { id } });
  }

  async getDashboardStats() {
    const today = todayKstYyyymmdd();

    const [totalUsers, activeUsers, todayRaces, activeSubscriptions] =
      await Promise.all([
        this.userRepo.count(),
        this.userRepo.count({ where: { isActive: true } }),
        this.raceRepo.count({ where: { rcDate: today } }),
        this.subscriptionRepo.count({
          where: { status: SubscriptionStatus.ACTIVE },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      todayRaces,
      activeSubscriptions,
    };
  }

  async getRevenueStats(period?: string) {
    const subs = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    const monthlyRevenue = subs.reduce((s, sub) => s + sub.price, 0);

    const singleAgg = await this.singlePurchaseRepo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.totalAmount), 0)', 'sum')
      .addSelect('COUNT(*)', 'count')
      .getRawOne<{ sum: string; count: string }>();
    const singleRevenue = parseInt(singleAgg?.sum ?? '0', 10);
    const singlePurchaseCount = parseInt(singleAgg?.count ?? '0', 10);

    const totalRevenue = monthlyRevenue + singleRevenue;
    const monthlyCost = 0;
    const monthlyProfit = totalRevenue - monthlyCost;
    const margin = totalRevenue > 0 ? (monthlyProfit / totalRevenue) * 100 : 0;

    const subscriptionByPlan = Array.from(
      subs.reduce((map, sub) => {
        const name = sub.plan?.planName ?? 'Unknown';
        const cur = map.get(name) ?? { count: 0, revenue: 0 };
        cur.count++;
        cur.revenue += sub.price;
        map.set(name, cur);
        return map;
      }, new Map<string, { count: number; revenue: number }>()),
    ).map(([planName, v]) => ({
      planName,
      count: v.count,
      revenue: v.revenue,
    }));

    const periodType = period || 'month';
    const rows: Array<{
      period: string;
      revenue: number;
      payout: number;
      profit: number;
    }> = [];

    if (periodType === 'day') {
      const dayStart = kst().startOf('day').toDate();
      const dayEnd = kst().endOf('day').toDate();
      const daySingle = await this.singlePurchaseRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.totalAmount), 0)', 'sum')
        .where('s.purchasedAt >= :start', { start: dayStart })
        .andWhere('s.purchasedAt < :end', { end: dayEnd })
        .getRawOne<{ sum: string }>();
      const dayRev = parseInt(daySingle?.sum ?? '0', 10);
      rows.push({
        period: kst().format('YYYY-MM-DD'),
        revenue: dayRev,
        payout: 0,
        profit: dayRev,
      });
    } else if (periodType === 'year') {
      const y = kst().year();
      const yearSingle = await this.singlePurchaseRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.totalAmount), 0)', 'sum')
        .where('s.purchasedAt >= :start', { start: new Date(`${y}-01-01`) })
        .andWhere('s.purchasedAt < :end', { end: new Date(`${y + 1}-01-01`) })
        .getRawOne<{ sum: string }>();
      const yearRev =
        monthlyRevenue * 12 + parseInt(yearSingle?.sum ?? '0', 10);
      rows.push({
        period: String(y),
        revenue: yearRev,
        payout: 0,
        profit: yearRev,
      });
    } else {
      const now = new Date();
      const m =
        now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      rows.push({
        period: m,
        revenue: totalRevenue,
        payout: monthlyCost,
        profit: monthlyProfit,
      });
      for (let i = 1; i <= 11; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mp =
          d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        const monthSingle = await this.singlePurchaseRepo
          .createQueryBuilder('s')
          .select('COALESCE(SUM(s.totalAmount), 0)', 'sum')
          .where('s.purchasedAt >= :start', { start })
          .andWhere('s.purchasedAt <= :end', { end })
          .getRawOne<{ sum: string }>();
        const rev = parseInt(monthSingle?.sum ?? '0', 10);
        rows.push({ period: mp, revenue: rev, payout: 0, profit: rev });
      }
    }

    return {
      monthlyRevenue,
      singleRevenue,
      totalRevenue,
      monthlyCost,
      monthlyProfit,
      margin,
      activeSubscribers: subs.length,
      avgRevenuePerUser: subs.length > 0 ? monthlyRevenue / subs.length : 0,
      subscriptionByPlan,
      singlePurchaseCount,
      rows,
    };
  }

  async getUsersGrowth(days: number) {
    const d = Math.min(90, Math.max(7, Number(days) || 30));
    const startKst = kst().subtract(d, 'day').startOf('day');
    const start = startKst.toDate();

    const users = await this.userRepo.find({
      where: { createdAt: Between(start, new Date()) },
      select: ['createdAt'],
    });

    const byDate: Record<string, number> = {};
    for (let i = 0; i < d; i++) {
      const key = startKst.add(i, 'day').format('YYYY-MM-DD');
      byDate[key] = 0;
    }
    users.forEach((u) => {
      const key = dateToKstDash(new Date(u.createdAt));
      if (byDate[key] !== undefined) byDate[key]++;
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  async getPredictionTicketUsage(page: number, limit: number, userId?: number) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const where: { status: TicketStatus; userId?: number } = {
      status: TicketStatus.USED,
    };
    if (userId != null) where.userId = userId;

    const [tickets, total] = await this.predictionTicketRepo.findAndCount({
      where,
      relations: ['user'],
      order: { usedAt: 'DESC' },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const raceIds = [
      ...new Set(
        tickets.map((t) => t.raceId).filter((id): id is number => id != null),
      ),
    ];
    let raceMap = new Map<number, Race>();
    if (raceIds.length > 0) {
      const races = await this.raceRepo.find({
        where: { id: In(raceIds) },
        select: ['id', 'rcNo', 'meet', 'meetName', 'rcDate', 'rcName'],
      });
      raceMap = new Map(races.map((r) => [r.id, r]));
    }

    const items = tickets.map((t) => ({
      id: t.id,
      userId: t.userId,
      user: t.user
        ? {
            id: t.user.id,
            email: t.user.email,
            name: t.user.name,
            nickname: t.user.nickname,
          }
        : null,
      raceId: t.raceId,
      race: t.raceId ? (raceMap.get(t.raceId) ?? null) : null,
      predictionId: t.predictionId,
      prediction: null,
      type: t.type,
      usedAt: t.usedAt,
      matrixDate: t.matrixDate,
    }));

    return {
      items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getTicketUsageTrend(days: number) {
    const d = Math.min(90, Math.max(7, Number(days) || 30));
    const startKst = kst().subtract(d, 'day').startOf('day');
    const start = startKst.toDate();

    const tickets = await this.predictionTicketRepo.find({
      where: { status: TicketStatus.USED },
      select: ['usedAt'],
    });
    const filtered = tickets.filter(
      (t) => t.usedAt && new Date(t.usedAt) >= start,
    );

    const byDate: Record<string, number> = {};
    for (let i = 0; i < d; i++) {
      const key = startKst.add(i, 'day').format('YYYY-MM-DD');
      byDate[key] = 0;
    }
    filtered.forEach((t) => {
      if (t.usedAt) {
        const key = dateToKstDash(new Date(t.usedAt));
        if (byDate[key] != null) byDate[key]++;
      }
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  /** Aggregate BI dashboard metrics for the admin analytics page. */
  async getDashboardAnalytics() {
    const today = todayKstYyyymmdd();
    const now = kst();
    const weekAgo = now.subtract(7, 'day').toDate();
    const monthStart = now.startOf('month').toDate();
    const monthEnd = now.endOf('month').toDate();

    // --- User metrics ---
    const [totalUsers, newToday, newThisWeek, newThisMonth, activeSubscribers] =
      await Promise.all([
        this.userRepo.count(),
        this.userRepo.count({
          where: {
            createdAt: Between(
              now.startOf('day').toDate(),
              now.endOf('day').toDate(),
            ),
          },
        }),
        this.userRepo.count({
          where: { createdAt: Between(weekAgo, new Date()) },
        }),
        this.userRepo.count({
          where: { createdAt: Between(monthStart, monthEnd) },
        }),
        this.subscriptionRepo.count({
          where: { status: SubscriptionStatus.ACTIVE },
        }),
      ]);

    // Subscriptions by plan (active only)
    const activeSubs = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    const subscriptionsByPlan = { LIGHT: 0, STANDARD: 0, PREMIUM: 0 };
    for (const sub of activeSubs) {
      const name = (sub.plan?.planName ?? '').toUpperCase();
      if (name === 'LIGHT') subscriptionsByPlan.LIGHT++;
      else if (name === 'STANDARD') subscriptionsByPlan.STANDARD++;
      else if (name === 'PREMIUM') subscriptionsByPlan.PREMIUM++;
    }

    // --- Revenue metrics ---
    const mrr = activeSubs.reduce((s, sub) => s + (sub.price ?? 0), 0);

    const thisMonthSingleAgg = await this.singlePurchaseRepo
      .createQueryBuilder('sp')
      .select('COALESCE(SUM(sp.totalAmount), 0)', 'sum')
      .where('sp.purchasedAt >= :start', { start: monthStart })
      .andWhere('sp.purchasedAt <= :end', { end: monthEnd })
      .getRawOne<{ sum: string }>();
    const thisMonthSingle = parseInt(thisMonthSingleAgg?.sum ?? '0', 10);
    const thisMonthTotal = mrr + thisMonthSingle;

    const cancelledThisMonth = await this.subscriptionRepo
      .createQueryBuilder('sub')
      .where('sub.status = :status', { status: SubscriptionStatus.CANCELLED })
      .andWhere('sub.updatedAt >= :start', { start: monthStart })
      .andWhere('sub.updatedAt <= :end', { end: monthEnd })
      .getCount();

    const totalActivePlusCancelled = activeSubscribers + cancelledThisMonth;
    const churnRate =
      totalActivePlusCancelled > 0
        ? Math.round((cancelledThisMonth / totalActivePlusCancelled) * 10000) /
          100
        : 0;

    // --- Prediction metrics ---
    const [totalGenerated, completedPredictions] = await Promise.all([
      this.predictionRepo.count(),
      this.predictionRepo.find({
        where: { status: PredictionStatus.COMPLETED },
        select: ['accuracy'],
      }),
    ]);

    const accuracyValues = completedPredictions
      .map((p) => p.accuracy)
      .filter((a): a is number => a != null);
    const avgAccuracy =
      accuracyValues.length > 0
        ? Math.round(
            (accuracyValues.reduce((s, v) => s + v, 0) /
              accuracyValues.length) *
              100,
          ) / 100
        : 0;

    // Accuracy this month (predictions where the race completed this month)
    const monthPredictions = await this.predictionRepo
      .createQueryBuilder('pred')
      .select('pred.accuracy', 'accuracy')
      .where('pred.status = :status', { status: PredictionStatus.COMPLETED })
      .andWhere('pred.updatedAt >= :start', { start: monthStart })
      .andWhere('pred.updatedAt <= :end', { end: monthEnd })
      .andWhere('pred.accuracy IS NOT NULL')
      .getRawMany<{ accuracy: string }>();
    const monthAccVals = monthPredictions.map((p) => parseFloat(p.accuracy));
    const accuracyThisMonth =
      monthAccVals.length > 0
        ? Math.round(
            (monthAccVals.reduce((s, v) => s + v, 0) / monthAccVals.length) *
              100,
          ) / 100
        : 0;

    // High-confidence predictions: winProb >= 70 in scores JSONB
    const highConfidenceCount = await this.predictionRepo
      .createQueryBuilder('pred')
      .where(
        `pred.scores IS NOT NULL AND (pred.scores->>'winProb')::numeric >= 70`,
      )
      .getCount();

    // --- Operations metrics ---
    const [totalBatch, completedBatch, failedToday] = await Promise.all([
      this.batchScheduleRepo.count(),
      this.batchScheduleRepo.count({
        where: { status: BatchScheduleStatus.COMPLETED },
      }),
      this.batchScheduleRepo
        .createQueryBuilder('bs')
        .where('bs.status = :status', { status: BatchScheduleStatus.FAILED })
        .andWhere('bs.updatedAt >= :start', {
          start: now.startOf('day').toDate(),
        })
        .getCount(),
    ]);
    const batchSuccessRate =
      totalBatch > 0
        ? Math.round((completedBatch / totalBatch) * 10000) / 100
        : 0;

    // KRA last sync timestamp
    const lastSyncLog = await this.kraSyncLogRepo.findOne({
      order: { createdAt: 'DESC' },
      select: ['createdAt'],
    });
    const kraLastSyncAt = lastSyncLog?.createdAt?.toISOString() ?? null;

    const [racesToday, racesCompleted] = await Promise.all([
      this.raceRepo.count({ where: { rcDate: today } }),
      this.raceRepo
        .createQueryBuilder('r')
        .where('r.rcDate = :today', { today })
        .andWhere('r.status = :status', { status: 'COMPLETED' })
        .getCount(),
    ]);

    // --- Ticket metrics ---
    const [raceTicketsActive, matrixTicketsActive, ticketsUsedThisMonth] =
      await Promise.all([
        this.predictionTicketRepo
          .createQueryBuilder('t')
          .where('t.status = :status', { status: TicketStatus.AVAILABLE })
          .andWhere("t.type = 'RACE'")
          .getCount(),
        this.predictionTicketRepo
          .createQueryBuilder('t')
          .where('t.status = :status', { status: TicketStatus.AVAILABLE })
          .andWhere("t.type = 'MATRIX'")
          .getCount(),
        this.predictionTicketRepo
          .createQueryBuilder('t')
          .where('t.status = :status', { status: TicketStatus.USED })
          .andWhere('t.usedAt >= :start', { start: monthStart })
          .andWhere('t.usedAt <= :end', { end: monthEnd })
          .getCount(),
      ]);

    return {
      users: {
        total: totalUsers,
        newToday,
        newThisWeek,
        newThisMonth,
        activeSubscribers,
        subscriptionsByPlan,
      },
      revenue: {
        mrr,
        thisMonthTotal,
        cancelledThisMonth,
        churnRate,
      },
      predictions: {
        totalGenerated,
        avgAccuracy,
        accuracyThisMonth,
        highConfidenceCount,
      },
      operations: {
        batchSuccessRate,
        batchFailedToday: failedToday,
        kraLastSyncAt,
        racesToday,
        racesCompleted,
      },
      tickets: {
        raceTicketsActive,
        matrixTicketsActive,
        ticketsUsedThisMonth,
      },
    };
  }
}
