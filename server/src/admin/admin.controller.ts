import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
  Body,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { KraService } from '../kra/kra.service';
import { UsersService } from '../users/users.service';
import { GlobalConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SinglePurchasesService } from '../single-purchases/single-purchases.service';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { UpdateUserDto } from '../users/dto/user.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly kraService: KraService,
    private readonly usersService: UsersService,
    private readonly configService: GlobalConfigService,
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notificationsService: NotificationsService,
    private readonly singlePurchasesService: SinglePurchasesService,
    private readonly predictionTicketsService: PredictionTicketsService,
  ) {}

  // --- KRA Data Sync Endpoints ---

  @Post('kra/sync/schedule')
  @ApiOperation({
    summary: '[Admin] KRA 경주 계획/출전표 동기화',
    description:
      'date 미지정 시 오늘부터 1년 내 미래 경주일(금·토·일) 전체 적재. date 지정 시 해당 날짜만 적재.',
  })
  async syncSchedule(@Query('date') date?: string) {
    const norm = (s: string) => s.replace(/-/g, '').slice(0, 8);
    if (date && norm(date)) {
      return this.kraService.syncEntrySheet(norm(date));
    }
    return this.kraService.syncUpcomingSchedules();
  }

  @Post('kra/sync/results')
  @ApiOperation({
    summary: '[Admin] KRA 경주 결과 동기화',
    description:
      'date 미지정 시 오늘 기준 과거 1년(금·토·일 경주일만) 적재. date 지정 시 해당 날짜만 적재.',
  })
  async syncResults(@Query('date') date?: string) {
    const norm = (s: string) => s.replace(/-/g, '').slice(0, 8);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    if (date && norm(date)) {
      return this.kraService.fetchRaceResults(norm(date));
    }
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateFrom = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');
    return this.kraService.syncHistoricalBackfill(dateFrom, today);
  }

  @Post('kra/sync/details')
  @ApiOperation({ summary: '[Admin] KRA 상세/훈련정보 동기화 (Group B)' })
  async syncDetails(@Query('date') date?: string) {
    const d =
      date?.replace(/-/g, '').slice(0, 8) ||
      new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return this.kraService.syncAnalysisData(d);
  }

  @Get('kra/status')
  @ApiOperation({ summary: '[Admin] KRA 설정 상태 (Base URL, API 키 여부)' })
  async getKraStatus() {
    return this.kraService.getKraStatus();
  }

  @Get('kra/sync-logs')
  @ApiOperation({ summary: '[Admin] KRA 동기화 로그 조회' })
  async getKraSyncLogs(
    @Query('endpoint') endpoint?: string,
    @Query('rcDate') rcDate?: string,
    @Query('limit') limit?: number,
  ) {
    const take = Math.min(Number(limit) || 50, 100);
    const logs = await this.prisma.kraSyncLog.findMany({
      where: {
        ...(endpoint && { endpoint }),
        ...(rcDate && { rcDate }),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { logs, total: logs.length };
  }

  @Post('kra/seed-sample')
  @ApiOperation({
    summary: '[Admin] 샘플 경주 데이터 적재 (KRA 키 없이 개발용)',
  })
  async seedSample(@Query('date') date?: string) {
    return this.kraService.seedSampleRaces(date);
  }

  @Post('kra/sync/jockeys')
  @ApiOperation({ summary: '[Admin] KRA 기수 통산전적 동기화' })
  async syncJockeys(@Query('meet') meet?: string) {
    return this.kraService.fetchJockeyTotalResults(meet);
  }

  @Post('kra/sync/all')
  @ApiOperation({ summary: '[Admin] KRA 전체 적재 (출전표→결과→상세→기수)' })
  async syncAll(@Query('date') date?: string) {
    const d =
      date?.replace(/-/g, '').slice(0, 8) ||
      new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return this.kraService.syncAll(d);
  }

  @Post('kra/sync/historical')
  @ApiOperation({ summary: '[Admin] 과거 경마 기록 적재 (몇 년치 백업용)' })
  async syncHistorical(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    if (!dateFrom || !dateTo) {
      throw new Error('dateFrom, dateTo (YYYYMMDD) 필수');
    }
    return this.kraService.syncHistoricalBackfill(dateFrom, dateTo);
  }

  // --- User Management Endpoints ---

  @Get('users')
  @ApiOperation({ summary: '[Admin] 사용자 목록 조회' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.usersService.findAll({
      page,
      limit,
      role,
      search,
    });
    return {
      data: result.users,
      meta: {
        total: result.total,
        page: result.page,
        limit: limit ?? 20,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: '[Admin] 사용자 상세 조회' })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '[Admin] 사용자 수정' })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: '[Admin] 사용자 삭제(비활성화)' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: '[Admin] 사용자 활성화' })
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.update(id, { isActive: true } as UpdateUserDto);
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: '[Admin] 사용자 비활성화' })
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.update(id, { isActive: false } as UpdateUserDto);
  }

  @Post('users/:id/grant-tickets')
  @ApiOperation({ summary: '[Admin] 사용자에게 예측권 지급' })
  async grantTickets(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { count: number; expiresInDays?: number },
  ) {
    const count = Math.min(100, Math.max(1, Number(body.count) || 1));
    const expiresInDays = Math.min(
      365,
      Math.max(1, Number(body.expiresInDays) || 30),
    );
    return this.predictionTicketsService.grantTickets(id, count, expiresInDays);
  }

  // --- AI Config (Gemini) ---

  @Get('ai/config')
  @ApiOperation({ summary: '[Admin] AI 설정 조회 (Gemini)' })
  async getAIConfig() {
    const raw = await this.configService.get('ai_config');
    const defaults = {
      llmProvider: 'gemini',
      primaryModel: 'gemini-2.5-flash',
      availableModels: [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro',
        'gemini-1.5-pro-002',
        'gemini-pro',
      ],
      fallbackModels: ['gemini-1.5-flash', 'gemini-pro'],
      costStrategy: 'balanced',
      temperature: 0.7,
      maxTokens: 1000,
      enableCaching: true,
      cacheTTL: 3600,
      enableBatchPrediction: true,
      batchCronSchedule: '0 9 * * 5,6,0',
      enableAutoUpdate: true,
      updateIntervalMinutes: 10,
      oddsChangeThreshold: 10,
      promptVersion: 'v1.0.0',
      systemPromptTemplate: '',
    };
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  }

  @Post('ai/config')
  @ApiOperation({ summary: '[Admin] AI 설정 저장 (Gemini)' })
  async updateAIConfig(@Body() body: any) {
    await this.configService.set('ai_config', JSON.stringify(body));
    return body;
  }

  @Get('config/system')
  @ApiOperation({ summary: '[Admin] 시스템 설정 조회' })
  async getSystemConfig() {
    const all = await this.configService.getAll();
    return {
      show_google_login:
        all.show_google_login === 'true' || all.show_google_login === '1',
      kra_base_url_override: all.kra_base_url_override || '',
    };
  }

  @Patch('config/system')
  @ApiOperation({ summary: '[Admin] 시스템 설정 저장' })
  async updateSystemConfig(
    @Body()
    body: {
      show_google_login?: boolean;
      kra_base_url_override?: string;
    },
  ) {
    if (body.show_google_login !== undefined) {
      await this.configService.set(
        'show_google_login',
        body.show_google_login ? 'true' : 'false',
      );
    }
    if (body.kra_base_url_override !== undefined) {
      await this.configService.set(
        'kra_base_url_override',
        String(body.kra_base_url_override),
      );
    }
    return this.getSystemConfig();
  }

  /** 경주당 비용 (원) - Admin ai-config와 동일 */
  private static readonly MODEL_COST: Record<string, number> = {
    'gemini-2.5-flash': 5,
    'gemini-2.0-flash-exp': 5,
    'gemini-2.0-flash': 5,
    'gemini-1.5-pro': 12,
    'gemini-1.5-pro-002': 12,
    'gemini-1.5-flash': 4,
    'gemini-1.5-flash-8b': 2,
    'gemini-pro': 8,
  };
  private static readonly RACES_PER_MONTH = 50;

  @Get('ai/estimate-cost')
  @ApiOperation({ summary: '[Admin] AI 예상 비용 (설정 기반)' })
  async estimateCost() {
    const raw = await this.configService.get('ai_config');
    const config = raw ? JSON.parse(raw) : {};
    const strategyMonthly: Record<string, number> = {
      premium: 7200,
      balanced: 3600,
      budget: 1200,
    };
    const rawMonthly =
      typeof config.primaryModel === 'string' &&
      AdminController.MODEL_COST[config.primaryModel] != null
        ? AdminController.MODEL_COST[config.primaryModel] *
          AdminController.RACES_PER_MONTH
        : (strategyMonthly[config.costStrategy ?? 'balanced'] ?? 3600);
    const modelCost =
      typeof config.primaryModel === 'string'
        ? (AdminController.MODEL_COST[config.primaryModel] ?? 12)
        : rawMonthly / AdminController.RACES_PER_MONTH;
    const enableCaching = config.enableCaching ?? true;
    const estimatedMonthlyCost = enableCaching
      ? Math.round(rawMonthly * 0.01)
      : rawMonthly;
    return {
      estimatedMonthlyCost,
      primaryModel: config.primaryModel ?? null,
      costStrategy: config.costStrategy ?? 'balanced',
      enableCaching,
      calculationText:
        typeof config.primaryModel === 'string'
          ? enableCaching
            ? `경주당 ₩${modelCost} × ${AdminController.RACES_PER_MONTH}경기/월 × 1%(캐싱) ≈ ₩${estimatedMonthlyCost.toLocaleString()}`
            : `경주당 ₩${modelCost} × ${AdminController.RACES_PER_MONTH}경기/월 ≈ ₩${rawMonthly.toLocaleString()} (캐싱 ON 시 99%↓)`
          : `전략 ${config.costStrategy ?? 'balanced'} (캐싱 ${enableCaching ? 'ON' : 'OFF'}) ≈ ₩${estimatedMonthlyCost.toLocaleString()}`,
    };
  }

  // --- Bets (Admin 전체 조회) ---

  @Get('bets')
  @ApiOperation({ summary: '[Admin] 마권 목록 조회' })
  async getBets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('raceId') raceId?: string,
    @Query('status') status?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const where: any = {};
    if (userId) where.userId = parseInt(userId, 10);
    if (raceId) where.raceId = parseInt(raceId, 10);
    if (status) where.betStatus = status;

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        orderBy: { betTime: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: { race: true },
      }),
      this.prisma.bet.count({ where }),
    ]);

    return {
      data: bets,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  @Get('bets/:id')
  @ApiOperation({ summary: '[Admin] 마권 상세 조회' })
  async getBet(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.bet.findUnique({
      where: { id },
      include: {
        race: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  // --- Subscription Plans (Admin) ---

  @Get('subscriptions/plans')
  @ApiOperation({ summary: '[Admin] 구독 플랜 목록 (전체)' })
  async getSubscriptionPlans() {
    return this.subscriptionsService.getPlansAdmin();
  }

  @Post('subscriptions/plans')
  @ApiOperation({ summary: '[Admin] 구독 플랜 생성' })
  async createSubscriptionPlan(
    @Body()
    body: {
      planName: string;
      displayName: string;
      description?: string;
      originalPrice: number;
      vat: number;
      totalPrice: number;
      baseTickets: number;
      bonusTickets: number;
      totalTickets: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.subscriptionsService.createPlan(body);
  }

  @Get('subscriptions/plans/:id')
  @ApiOperation({ summary: '[Admin] 구독 플랜 상세' })
  async getSubscriptionPlan(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
  }

  @Patch('subscriptions/plans/:id')
  @ApiOperation({ summary: '[Admin] 구독 플랜 수정' })
  async updateSubscriptionPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.subscriptionsService.updatePlan(id, body);
  }

  @Delete('subscriptions/plans/:id')
  @ApiOperation({ summary: '[Admin] 구독 플랜 삭제 또는 비활성화' })
  async deleteSubscriptionPlan(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.deletePlan(id);
  }

  // --- Notifications (Admin) ---

  @Get('notifications')
  @ApiOperation({ summary: '[Admin] 알림 목록 조회' })
  async getNotifications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findAllAdmin({ page, limit });
  }

  @Post('notifications/send')
  @ApiOperation({ summary: '[Admin] 대상별 알림 발송' })
  async sendNotification(
    @Body() body: { title: string; message: string; target: string },
  ) {
    return this.notificationsService.adminSend(body);
  }

  // --- Single Purchase Config (Admin) ---

  @Get('single-purchase/config')
  @ApiOperation({ summary: '[Admin] 개별 구매 설정 조회' })
  async getSinglePurchaseConfig() {
    return this.singlePurchasesService.getConfig();
  }

  @Patch('single-purchase/config')
  @ApiOperation({ summary: '[Admin] 개별 구매 설정 수정' })
  async updateSinglePurchaseConfig(@Body() body: any) {
    return this.singlePurchasesService.updateConfig(body);
  }

  // --- Statistics / Dashboard ---

  @Get('statistics/dashboard')
  @ApiOperation({ summary: '[Admin] 대시보드 통계' })
  async getDashboardStats() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    const [
      totalUsers,
      activeUsers,
      todayRaces,
      todayBetsCount,
      todayBetsAmount,
      totalBetsAgg,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.race.count({ where: { rcDate: today } }),
      this.prisma.bet.count({
        where: {
          betTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.bet.aggregate({
        where: {
          betTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        _sum: { betAmount: true },
      }),
      this.prisma.bet.aggregate({
        _count: true,
        _sum: { betAmount: true },
      }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    const todayBets = {
      count: todayBetsCount,
      amount: todayBetsAmount._sum?.betAmount ?? 0,
    };
    const totalBets = {
      count: totalBetsAgg._count,
      amount: totalBetsAgg._sum?.betAmount ?? 0,
      winAmount: 0, // actualWin sum 계산 필요
    };

    const winAmountAgg = await this.prisma.bet.aggregate({
      where: { actualWin: { not: null } },
      _sum: { actualWin: true },
    });
    totalBets.winAmount = winAmountAgg._sum?.actualWin ?? 0;

    return {
      totalUsers,
      activeUsers,
      todayRaces,
      todayBets,
      totalBets,
      activeSubscriptions,
    };
  }

  @Get('statistics/revenue')
  @ApiOperation({ summary: '[Admin] 수익 통계' })
  async getRevenueStats(@Query('period') period?: string) {
    const subs = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });
    const monthlyRevenue = subs.reduce((s, sub) => s + (sub.price ?? 0), 0);

    const singleAgg = await this.prisma.singlePurchase.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
    });
    const singleRevenue = singleAgg._sum?.totalAmount ?? 0;
    const singlePurchaseCount = singleAgg._count?.id ?? 0;

    const totalRevenue = monthlyRevenue + singleRevenue;
    const monthlyCost = 0; // AI/인프라 비용은 추후 연동
    const monthlyProfit = totalRevenue - monthlyCost;
    const margin = totalRevenue > 0 ? (monthlyProfit / totalRevenue) * 100 : 0;

    const subscriptionByPlan: Array<{
      planName: string;
      count: number;
      revenue: number;
    }> = [];
    const planMap = new Map<string, { count: number; revenue: number }>();
    for (const sub of subs) {
      const name = sub.plan?.planName ?? 'Unknown';
      const curr = planMap.get(name) ?? { count: 0, revenue: 0 };
      curr.count++;
      curr.revenue += sub.price ?? 0;
      planMap.set(name, curr);
    }
    planMap.forEach((v, k) =>
      subscriptionByPlan.push({
        planName: k,
        count: v.count,
        revenue: v.revenue,
      }),
    );

    const periodType = period || 'month';
    const rows: Array<{
      period: string;
      revenue: number;
      payout: number;
      profit: number;
    }> = [];

    if (periodType === 'day') {
      const today = new Date().toISOString().slice(0, 10);
      const daySingle = await this.prisma.singlePurchase.aggregate({
        where: {
          purchasedAt: {
            gte: new Date(today + 'T00:00:00.000Z'),
            lt: new Date(new Date(today).getTime() + 86400000),
          },
        },
        _sum: { totalAmount: true },
      });
      const dayRev = daySingle._sum?.totalAmount ?? 0;
      rows.push({
        period: today,
        revenue: dayRev,
        payout: 0,
        profit: dayRev,
      });
    } else if (periodType === 'year') {
      const y = new Date().getFullYear();
      const yearSingle = await this.prisma.singlePurchase.aggregate({
        where: {
          purchasedAt: {
            gte: new Date(`${y}-01-01`),
            lt: new Date(`${y + 1}-01-01`),
          },
        },
        _sum: { totalAmount: true },
      });
      const yearRev = monthlyRevenue * 12 + (yearSingle._sum?.totalAmount ?? 0);
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
        const monthSingle = await this.prisma.singlePurchase.aggregate({
          where: { purchasedAt: { gte: start, lte: end } },
          _sum: { totalAmount: true },
        });
        const rev = monthSingle._sum?.totalAmount ?? 0;
        rows.unshift({
          period: mp,
          revenue: rev,
          payout: 0,
          profit: rev,
        });
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

  @Get('statistics/users-growth')
  @ApiOperation({ summary: '[Admin] 사용자 증가 추이' })
  async getUsersGrowth(@Query('days') days?: number) {
    const d = Math.min(90, Math.max(7, Number(days) || 30));
    const start = new Date();
    start.setDate(start.getDate() - d);
    start.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    });

    const byDate: Record<string, number> = {};
    for (let i = 0; i < d; i++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + i);
      const key = dt.toISOString().slice(0, 10);
      byDate[key] = 0;
    }
    users.forEach((u) => {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (byDate[key] !== undefined) byDate[key]++;
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  @Get('statistics/ticket-usage-trend')
  @ApiOperation({ summary: '[Admin] 예측권 사용량 추이' })
  async getTicketUsageTrend(@Query('days') days?: number) {
    const d = Math.min(90, Math.max(7, Number(days) || 30));
    const start = new Date();
    start.setDate(start.getDate() - d);
    start.setHours(0, 0, 0, 0);

    const tickets = await this.prisma.predictionTicket.findMany({
      where: { status: 'USED', usedAt: { gte: start } },
      select: { usedAt: true },
    });

    const byDate: Record<string, number> = {};
    for (let i = 0; i < d; i++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + i);
      const key = dt.toISOString().slice(0, 10);
      byDate[key] = 0;
    }
    tickets.forEach((t) => {
      if (t.usedAt) {
        const key = t.usedAt.toISOString().slice(0, 10);
        if (byDate[key] != null) byDate[key]++;
      }
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}
