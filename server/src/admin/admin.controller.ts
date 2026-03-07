import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  Param,
  Body,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, BetStatus } from '../database/db-enums';
import { KraService } from '../kra/kra.service';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { GlobalConfigService } from '../config/config.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SinglePurchasesService } from '../single-purchases/single-purchases.service';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { AdminActivityInterceptor } from '../activity-logs/admin-activity.interceptor';
import { WeeklyPreviewService } from '../weekly-preview/weekly-preview.service';
import { UpdateUserDto } from '../users/dto/user.dto';
import { todayKstYyyymmdd, kst } from '../common/utils/kst';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AdminActivityInterceptor)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly kraService: KraService,
    private readonly usersService: UsersService,
    private readonly configService: GlobalConfigService,
    private readonly adminService: AdminService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notificationsService: NotificationsService,
    private readonly singlePurchasesService: SinglePurchasesService,
    private readonly predictionTicketsService: PredictionTicketsService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly weeklyPreviewService: WeeklyPreviewService,
  ) {}

  /** Write SSE event (progress or done). */
  private writeSse(res: Response, data: Record<string, unknown>): void {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  // --- KRA Data Sync Endpoints ---

  @Post('kra/sync/schedule')
  @ApiOperation({
    summary: '[Admin] KRA 경주 계획/출전표 동기화',
    description:
      'year 지정 시 해당 연도 전체(1~12월) 경주계획표만 적재(API72_2 월별 12회). date 지정 시 해당 날짜만 경주계획표→출전표 순. 둘 다 미지정 시 오늘~1년 내 금·토·일 전체(경주계획표+출전표).',
  })
  async syncSchedule(
    @Query('date') date?: string,
    @Query('year') year?: string,
  ) {
    const norm = (s: string) => s.replace(/-/g, '').slice(0, 8);
    const yearNum = year ? parseInt(year, 10) : 0;
    if (!Number.isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100) {
      return this.kraService.fetchRacePlanScheduleForYear(yearNum);
    }
    if (date && norm(date)) {
      return this.kraService.syncScheduleForDate(norm(date));
    }
    return this.kraService.syncUpcomingSchedules();
  }

  @Post('kra/sync/results')
  @ApiOperation({
    summary: '[Admin] KRA 경주 결과 동기화',
    description:
      'date 미지정 시 오늘 기준 과거 1년(금·토·일 경주일만) 적재. date 지정 시 해당 날짜만 적재. 경주 레코드가 없으면 결과 API 응답으로 생성 후 결과·출전마 적재(createRaceIfMissing=true). 단일 날짜 적재 시 결과 적재 후 같은 날짜로 출전표(entry sheet)를 자동 보강하여 출전마 상세 정보를 DB에 채웁니다.',
  })
  async syncResults(@Query('date') date?: string) {
    const norm = (s: string) => s.replace(/-/g, '').slice(0, 8);
    const today = todayKstYyyymmdd();
    if (date && norm(date)) {
      const d = norm(date);
      const resultRes = await this.kraService.fetchRaceResults(d, true);
      // Backfill 출전마(entry) from KRA entry sheet so DB has full entry info (기수·조교사·레이팅·통산 등)
      try {
        const entryRes = await this.kraService.syncEntrySheet(d);
        return {
          message: `${resultRes.message} 출전표 보강: ${entryRes.races ?? 0}경주, ${entryRes.entries ?? 0}건 출전마`,
          totalResults: resultRes.totalResults,
          entries: entryRes.entries,
          races: entryRes.races,
        };
      } catch (e) {
        // Entry sheet may be unavailable for some dates; return results summary anyway
        return {
          ...resultRes,
          entrySheetWarning:
            (e as Error)?.message ??
            '출전표 보강 실패(해당일 데이터 없을 수 있음)',
        };
      }
    }
    const dateFrom = kst().subtract(1, 'year').format('YYYYMMDD');
    return this.kraService.syncHistoricalBackfill(dateFrom, today);
  }

  @Post('kra/sync/results-stream')
  @ApiOperation({ summary: '[Admin] KRA 경주 결과 동기화 (진행률 스트리밍)' })
  async syncResultsStream(
    @Query('date') date: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const norm = (s: string) => s.replace(/-/g, '').slice(0, 8);
    const d = date && norm(date) ? norm(date) : null;
    if (!d) {
      res
        .status(400)
        .json({ message: 'date (YYYYMMDD or YYYY-MM-DD) required' });
      return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const onProgress = (percent: number, message: string) => {
      this.writeSse(res, { percent, message });
    };
    try {
      onProgress(0, '경주 결과 수집 시작…');
      const resultRes = await this.kraService.fetchRaceResults(d, true, {
        onProgress,
      });
      onProgress(50, '출전표 보강 중…');
      let entryRes: { races?: number; entries?: number } = {};
      try {
        entryRes = await this.kraService.syncEntrySheet(d, { onProgress });
      } catch (e) {
        this.writeSse(res, {
          percent: 100,
          message: '출전표 보강 건너뜀',
          warning: (e as Error)?.message,
        });
      }
      this.writeSse(res, {
        done: true,
        result: {
          message: `완료: ${resultRes.totalResults ?? 0}건 결과, ${entryRes.entries ?? 0}건 출전마`,
          totalResults: resultRes.totalResults,
          entries: entryRes.entries,
          races: entryRes.races,
        },
      });
    } catch (e) {
      this.writeSse(res, { done: true, error: (e as Error)?.message });
    } finally {
      res.end();
    }
  }

  @Post('kra/sync/schedule-stream')
  @ApiOperation({ summary: '[Admin] KRA 출전표 동기화 (진행률 스트리밍)' })
  async syncScheduleStream(
    @Query('date') date: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const norm = (s: string) => s.replace(/-/g, '').slice(0, 8);
    const d = date && norm(date) ? norm(date) : null;
    if (!d) {
      res.status(400).json({ message: 'date required' });
      return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const onProgress = (percent: number, message: string) => {
      this.writeSse(res, { percent, message });
    };
    try {
      const result = await this.kraService.syncScheduleForDate(d, {
        onProgress,
      });
      this.writeSse(res, { done: true, result });
    } catch (e) {
      this.writeSse(res, { done: true, error: (e as Error)?.message });
    } finally {
      res.end();
    }
  }

  @Post('kra/sync/all-stream')
  @ApiOperation({ summary: '[Admin] KRA 전체 적재 (진행률 스트리밍)' })
  async syncAllStream(
    @Query('date') date: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const d = date?.replace(/-/g, '').slice(0, 8) || todayKstYyyymmdd();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const onProgress = (percent: number, message: string) => {
      this.writeSse(res, { percent, message });
    };
    try {
      const result = await this.kraService.syncAll(d, { onProgress });
      this.writeSse(res, { done: true, result });
    } catch (e) {
      this.writeSse(res, { done: true, error: (e as Error)?.message });
    } finally {
      res.end();
    }
  }

  @Post('kra/sync/historical-stream')
  @ApiOperation({ summary: '[Admin] 과거 경마 기록 적재 (진행률 스트리밍)' })
  async syncHistoricalStream(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    if (!dateFrom || !dateTo) {
      res.status(400).json({ message: 'dateFrom, dateTo required' });
      return;
    }
    const from = dateFrom.replace(/-/g, '').slice(0, 8);
    const to = dateTo.replace(/-/g, '').slice(0, 8);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const onProgress = (percent: number, message: string) => {
      this.writeSse(res, { percent, message });
    };
    try {
      const result = await this.kraService.syncHistoricalBackfill(from, to, {
        onProgress,
      });
      this.writeSse(res, { done: true, result });
    } catch (e) {
      this.writeSse(res, { done: true, error: (e as Error)?.message });
    } finally {
      res.end();
    }
  }

  @Post('kra/sync/details')
  @ApiOperation({ summary: '[Admin] KRA 상세/훈련정보 동기화 (Group B)' })
  async syncDetails(@Query('date') date?: string) {
    const d = date?.replace(/-/g, '').slice(0, 8) || todayKstYyyymmdd();
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
    return this.adminService.getKraSyncLogs(endpoint, rcDate, Number(limit));
  }

  @Get('kra/batch-schedules')
  @ApiOperation({ summary: '[Admin] 배치 스케줄 목록 (예정/완료/실패)' })
  async getKraBatchSchedules(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.kraService.getBatchSchedules({ status, limit });
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
    const d = date?.replace(/-/g, '').slice(0, 8) || todayKstYyyymmdd();
    return this.kraService.syncAll(d);
  }

  @Post('kra/generate-predictions')
  @ApiOperation({ summary: '[Admin] 특정 날짜 AI 예측 일괄 생성' })
  async generatePredictionsForDate(@Query('date') date?: string) {
    const d = date?.replace(/-/g, '').slice(0, 8) || todayKstYyyymmdd();
    return this.kraService.generatePredictionsForDate(d);
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
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
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
  @ApiOperation({ summary: '[Admin] 사용자에게 예측권 지급 (RACE/MATRIX)' })
  async grantTickets(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: { count: number; expiresInDays?: number; type?: 'RACE' | 'MATRIX' },
  ) {
    const count = Math.min(100, Math.max(1, Number(body.count) || 1));
    const expiresInDays = Math.min(
      365,
      Math.max(1, Number(body.expiresInDays) || 30),
    );
    const type = body.type === 'MATRIX' ? 'MATRIX' : 'RACE';
    return this.predictionTicketsService.grantTickets(
      id,
      count,
      expiresInDays,
      type,
    );
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
  async updateAIConfig(@Body() body: Record<string, unknown>) {
    await this.configService.set('ai_config', JSON.stringify(body));
    return body;
  }

  @Get('config/system')
  @ApiOperation({ summary: '[Admin] 시스템 설정 조회' })
  async getSystemConfig() {
    const all = await this.configService.getAll();
    return {
      kra_base_url_override:       all.kra_base_url_override || '',
      signup_bonus_tickets:        all.signup_bonus_tickets || '1',
      signup_bonus_expires_days:   all.signup_bonus_expires_days || '30',
      consecutive_streak_days:     all.consecutive_streak_days || '7',
      consecutive_streak_tickets:  all.consecutive_streak_tickets || '1',
      consecutive_expires_days:    all.consecutive_expires_days || '30',
      referrer_ticket_count:       all.referrer_ticket_count || '3',
      referred_ticket_count:       all.referred_ticket_count || '2',
      referral_ticket_expires_days:all.referral_ticket_expires_days || '30',
      matrix_ticket_price:         all.matrix_ticket_price || '1000',
    };
  }

  @Patch('config/system')
  @ApiOperation({ summary: '[Admin] 시스템 설정 저장' })
  async updateSystemConfig(
    @Body()
    body: {
      kra_base_url_override?: string;
      signup_bonus_tickets?: string;
      signup_bonus_expires_days?: string;
      consecutive_streak_days?: string;
      consecutive_streak_tickets?: string;
      consecutive_expires_days?: string;
      referrer_ticket_count?: string;
      referred_ticket_count?: string;
      referral_ticket_expires_days?: string;
      matrix_ticket_price?: string;
    },
  ) {
    const keys = [
      'kra_base_url_override',
      'signup_bonus_tickets',
      'signup_bonus_expires_days',
      'consecutive_streak_days',
      'consecutive_streak_tickets',
      'consecutive_expires_days',
      'referrer_ticket_count',
      'referred_ticket_count',
      'referral_ticket_expires_days',
      'matrix_ticket_price',
    ] as const;
    for (const key of keys) {
      if (body[key] !== undefined) {
        await this.configService.set(key, String(body[key]));
      }
    }
    return this.getSystemConfig();
  }

  /** Cost per race (KRW) — same as Admin ai-config */
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

  // --- Bets (Admin full list) ---

  @Get('bets')
  @ApiOperation({ summary: '[Admin] 마권 목록 조회' })
  async getBets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('raceId') raceId?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getBetsAdmin(
      Number(page),
      Number(limit),
      userId != null ? parseInt(userId, 10) : undefined,
      raceId != null ? parseInt(raceId, 10) : undefined,
      status ?? undefined,
    );
  }

  @Get('bets/:id')
  @ApiOperation({ summary: '[Admin] 마권 상세 조회' })
  async getBet(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getBetById(id);
  }

  @Patch('bets/:id/status')
  @ApiOperation({ summary: '[Admin] 마권 상태 변경' })
  async updateBetStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    const valid = Object.values(BetStatus);
    const status = valid.includes(body?.status as BetStatus)
      ? (body.status as BetStatus)
      : BetStatus.PENDING;
    return this.adminService.updateBetStatus(id, status);
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
    return this.adminService.getSubscriptionPlanById(id);
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
  async updateSinglePurchaseConfig(@Body() body: Record<string, unknown>) {
    return this.singlePurchasesService.updateConfig(body);
  }

  @Get('single-purchase/calculate-price')
  @ApiOperation({ summary: '[Admin] 개별 구매 가격 계산 (미리보기)' })
  async calculateSinglePurchasePrice(@Query('quantity') quantity?: number) {
    return this.singlePurchasesService.calculatePrice(Number(quantity) || 1);
  }

  // --- Statistics / Dashboard ---

  @Get('statistics/dashboard')
  @ApiOperation({ summary: '[Admin] 대시보드 통계' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('statistics/revenue')
  @ApiOperation({ summary: '[Admin] 수익 통계' })
  async getRevenueStats(@Query('period') period?: string) {
    return this.adminService.getRevenueStats(period);
  }

  @Get('statistics/users-growth')
  @ApiOperation({ summary: '[Admin] 사용자 증가 추이' })
  async getUsersGrowth(@Query('days') days?: number) {
    const d = Math.min(90, Math.max(7, Number(days) || 30));
    return this.adminService.getUsersGrowth(d);
  }

  @Get('prediction-tickets/usage')
  @ApiOperation({
    summary: '[Admin] 예측권 사용 내역 (유저별, 경주·예측 내용 포함)',
  })
  async getPredictionTicketUsage(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.adminService.getPredictionTicketUsage(
      pageNum,
      limitNum,
      userId != null ? parseInt(userId, 10) : undefined,
    );
  }

  @Get('statistics/ticket-usage-trend')
  @ApiOperation({ summary: '[Admin] 예측권 사용량 추이' })
  async getTicketUsageTrend(@Query('days') days?: number) {
    const d = Math.min(90, Math.max(7, Number(days) || 30));
    return this.adminService.getTicketUsageTrend(d);
  }

  // --- Activity Logs ---

  @Get('activity-logs/admin')
  @ApiOperation({ summary: '[Admin] Admin activity audit log' })
  async getAdminActivityLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('adminUserId') adminUserId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.activityLogsService.getAdminLogs({
      page,
      limit,
      action,
      adminUserId: adminUserId ? parseInt(adminUserId, 10) : undefined,
      dateFrom,
      dateTo,
    });
  }

  @Get('activity-logs/users')
  @ApiOperation({ summary: '[Admin] User activity log' })
  async getUserActivityLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('event') event?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.activityLogsService.getUserLogs({
      page,
      limit,
      event,
      userId: userId ? parseInt(userId, 10) : undefined,
      dateFrom,
      dateTo,
    });
  }

  @Get('activity-logs/users/:userId/summary')
  @ApiOperation({ summary: '[Admin] User activity summary' })
  async getUserActivitySummary(@Param('userId', ParseIntPipe) userId: number) {
    return this.activityLogsService.getUserActivitySummary(userId);
  }

  // --- Weekly Preview ---

  @Post('weekly-preview/generate')
  @ApiOperation({ summary: '[Admin] Manually trigger weekly preview generation' })
  async generateWeeklyPreview(@Query('date') date?: string) {
    const fromDate = date ? new Date(date) : undefined;
    return this.weeklyPreviewService.generate({ fromDate });
  }

  @Get('weekly-preview/latest')
  @ApiOperation({ summary: '[Admin] Get latest weekly preview' })
  async getLatestWeeklyPreview() {
    return this.weeklyPreviewService.getLatest();
  }
}
