import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Bet } from '../../bets/entities/bet.entity';
import { Race } from '../../races/entities/race.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../subscriptions/entities/subscription.entity';

@Controller('admin/statistics')
@UseGuards(AdminGuard)
export class AdminStatisticsController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    @InjectRepository(Race)
    private readonly raceRepository: Repository<Race>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>
  ) {}

  @Get('dashboard')
  async getDashboardStats() {
    // 전체 회원 수
    const totalUsers = await this.userRepository.count();

    // 활성 회원 수
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });

    // 오늘 경주 수
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todayRaces = await this.raceRepository.count({
      where: { rcDate: today },
    });

    // 오늘 베팅 통계
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBetsResult = await this.betRepository
      .createQueryBuilder('bet')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(bet.betAmount), 0)', 'totalAmount')
      .where('bet.betTime BETWEEN :start AND :end', {
        start: todayStart,
        end: todayEnd,
      })
      .getRawOne();

    // 전체 베팅 통계
    const totalBetsResult = await this.betRepository
      .createQueryBuilder('bet')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(bet.betAmount), 0)', 'totalAmount')
      .addSelect('COALESCE(SUM(bet.actualWin), 0)', 'totalWin')
      .getRawOne();

    // 활성 구독자 수
    const activeSubscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', {
        status: SubscriptionStatus.ACTIVE,
      })
      .getCount()
      .catch(() => 0);

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      todayRaces: todayRaces || 0,
      todayBets: {
        count: parseInt(todayBetsResult?.count || '0', 10),
        amount: parseFloat(todayBetsResult?.totalAmount || '0'),
      },
      totalBets: {
        count: parseInt(totalBetsResult?.count || '0', 10),
        amount: parseFloat(totalBetsResult?.totalAmount || '0'),
        winAmount: parseFloat(totalBetsResult?.totalWin || '0'),
      },
      activeSubscriptions: activeSubscriptions || 0,
    };
  }

  @Get('users-growth')
  async getUsersGrowth(@Query('days') daysStr?: string) {
    try {
      const days = daysStr ? parseInt(daysStr, 10) : 30;
      const validDays = isNaN(days) ? 30 : days;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - validDays);

      const users = await this.userRepository
        .createQueryBuilder('user')
        .select("DATE_FORMAT(user.createdAt, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'count')
        .where('user.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      return users || [];
    } catch (error) {
      return [];
    }
  }

  @Get('bets-trend')
  async getBetsTrend(@Query('days') daysStr?: string) {
    try {
      const days = daysStr ? parseInt(daysStr, 10) : 30;
      const validDays = isNaN(days) ? 30 : days;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - validDays);

      const bets = await this.betRepository
        .createQueryBuilder('bet')
        .select("DATE_FORMAT(bet.betTime, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(bet.betAmount), 0)', 'amount')
        .addSelect('COALESCE(SUM(bet.actualWin), 0)', 'winAmount')
        .where('bet.betTime BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      return bets || [];
    } catch (error) {
      return [];
    }
  }

  @Get('revenue')
  async getRevenue(@Query('period') period: string = 'month') {
    try {
      let dateFormat = '%Y-%m';
      if (period === 'day') dateFormat = '%Y-%m-%d';
      if (period === 'year') dateFormat = '%Y';

      const revenue = await this.betRepository
        .createQueryBuilder('bet')
        .select(`DATE_FORMAT(bet.betTime, '${dateFormat}')`, 'period')
        .addSelect('COALESCE(SUM(bet.betAmount), 0)', 'revenue')
        .addSelect('COALESCE(SUM(bet.actualWin), 0)', 'payout')
        .addSelect(
          'COALESCE(SUM(bet.betAmount), 0) - COALESCE(SUM(bet.actualWin), 0)',
          'profit'
        )
        .groupBy('period')
        .orderBy('period', 'DESC')
        .limit(12)
        .getRawMany();

      return revenue || [];
    } catch (error) {
      return [];
    }
  }
}
