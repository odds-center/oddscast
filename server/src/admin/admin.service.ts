import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import { Bet } from '../database/entities/bet.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { User } from '../database/entities/user.entity';
import { Race } from '../database/entities/race.entity';
import { SinglePurchase } from '../database/entities/single-purchase.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { BetStatus } from '../database/db-enums';
import { SubscriptionStatus } from '../database/db-enums';
import { TicketStatus } from '../database/db-enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(KraSyncLog)
    private readonly kraSyncLogRepo: Repository<KraSyncLog>,
    @InjectRepository(Bet) private readonly betRepo: Repository<Bet>,
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

  async getBetsAdmin(
    page: number,
    limit: number,
    userId?: number,
    raceId?: number,
    status?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const where: { userId?: number; raceId?: number; betStatus?: BetStatus } =
      {};
    if (userId != null) where.userId = userId;
    if (raceId != null) where.raceId = raceId;
    if (status != null) where.betStatus = status as BetStatus;

    const [bets, total] = await this.betRepo.findAndCount({
      where,
      relations: ['race'],
      order: { betTime: 'DESC' },
      take: l,
      skip: (p - 1) * l,
    });
    const data = bets.map((b) => ({
      ...b,
      race: b.race
        ? {
            id: b.race.id,
            meet: b.race.meet,
            rcDate: b.race.rcDate,
            rcNo: b.race.rcNo,
            rcName: b.race.rcName,
          }
        : null,
    }));
    return {
      data,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  async getBetById(id: number) {
    const bet = await this.betRepo.findOne({
      where: { id },
      relations: ['race', 'user'],
    });
    if (!bet) return null;
    return {
      ...bet,
      race: bet.race
        ? {
            id: bet.race.id,
            meet: bet.race.meet,
            rcDate: bet.race.rcDate,
            rcNo: bet.race.rcNo,
            rcName: bet.race.rcName,
          }
        : null,
      user: bet.user
        ? { id: bet.user.id, email: bet.user.email, name: bet.user.name }
        : null,
    };
  }

  async updateBetStatus(id: number, status: BetStatus) {
    await this.betRepo.update(id, { betStatus: status, updatedAt: new Date() });
    return this.getBetById(id);
  }

  async getSubscriptionPlanById(id: number) {
    return this.planRepo.findOne({ where: { id } });
  }

  async getDashboardStats() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date().setHours(23, 59, 59, 999));

    const [
      totalUsers,
      activeUsers,
      todayRaces,
      todayBetsCount,
      todayBetsAmountSum,
      totalBetsCount,
      totalBetsAmountSum,
      activeSubscriptions,
      winAmountRes,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { isActive: true } }),
      this.raceRepo.count({ where: { rcDate: today } }),
      this.betRepo.count({
        where: { betTime: Between(dayStart, dayEnd) },
      }),
      this.betRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.betAmount), 0)', 'sum')
        .where('b.betTime >= :start', { start: dayStart })
        .andWhere('b.betTime < :end', { end: dayEnd })
        .getRawOne<{ sum: string }>()
        .then((r) => parseInt(r?.sum ?? '0', 10)),
      this.betRepo.count(),
      this.betRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.betAmount), 0)', 'sum')
        .getRawOne<{ sum: string }>()
        .then((r) => parseInt(r?.sum ?? '0', 10)),
      this.subscriptionRepo.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.betRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.actualWin), 0)', 'sum')
        .where('b.actualWin IS NOT NULL')
        .getRawOne<{ sum: string }>(),
    ]);

    const winAmount = parseInt(winAmountRes?.sum ?? '0', 10);

    return {
      totalUsers,
      activeUsers,
      todayRaces,
      todayBets: { count: todayBetsCount, amount: todayBetsAmountSum },
      totalBets: {
        count: totalBetsCount,
        amount: totalBetsAmountSum,
        winAmount,
      },
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
      const today = new Date().toISOString().slice(0, 10);
      const dayStart = new Date(today + 'T00:00:00.000Z');
      const dayEnd = new Date(new Date(today).getTime() + 86400000);
      const daySingle = await this.singlePurchaseRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.totalAmount), 0)', 'sum')
        .where('s.purchasedAt >= :start', { start: dayStart })
        .andWhere('s.purchasedAt < :end', { end: dayEnd })
        .getRawOne<{ sum: string }>();
      const dayRev = parseInt(daySingle?.sum ?? '0', 10);
      rows.push({ period: today, revenue: dayRev, payout: 0, profit: dayRev });
    } else if (periodType === 'year') {
      const y = new Date().getFullYear();
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
    const start = new Date();
    start.setDate(start.getDate() - d);
    start.setHours(0, 0, 0, 0);

    const users = await this.userRepo.find({
      where: { createdAt: Between(start, new Date()) },
      select: ['createdAt'],
    });

    const byDate: Record<string, number> = {};
    for (let i = 0; i < d; i++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + i);
      const key = dt.toISOString().slice(0, 10);
      byDate[key] = 0;
    }
    users.forEach((u) => {
      const key = new Date(u.createdAt).toISOString().slice(0, 10);
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
    const start = new Date();
    start.setDate(start.getDate() - d);
    start.setHours(0, 0, 0, 0);

    const tickets = await this.predictionTicketRepo.find({
      where: { status: TicketStatus.USED },
      select: ['usedAt'],
    });
    const filtered = tickets.filter(
      (t) => t.usedAt && new Date(t.usedAt) >= start,
    );

    const byDate: Record<string, number> = {};
    for (let i = 0; i < d; i++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + i);
      const key = dt.toISOString().slice(0, 10);
      byDate[key] = 0;
    }
    filtered.forEach((t) => {
      if (t.usedAt) {
        const key = new Date(t.usedAt).toISOString().slice(0, 10);
        if (byDate[key] != null) byDate[key]++;
      }
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}
