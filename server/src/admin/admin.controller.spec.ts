import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { KraService } from '../kra/kra.service';
import { UsersService } from '../users/users.service';
import { GlobalConfigService } from '../config/config.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SinglePurchasesService } from '../single-purchases/single-purchases.service';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { AdminActivityInterceptor } from '../activity-logs/admin-activity.interceptor';
import { WeeklyPreviewService } from '../weekly-preview/weekly-preview.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockKraService = {
  syncEntrySheet: jest.fn(),
  fetchRaceResults: jest.fn(),
  syncAnalysisData: jest.fn(),
  fetchJockeyTotalResults: jest.fn(),
  fetchDividends: jest.fn(),
  syncAll: jest.fn(),
  syncUpcomingSchedules: jest.fn(),
  syncScheduleForDate: jest.fn(),
  syncHistoricalBackfill: jest.fn(),
  fetchRacePlanScheduleForYear: jest.fn(),
  getBatchSchedules: jest.fn(),
  seedSampleRaces: jest.fn(),
  generatePredictionsForDate: jest.fn(),
  getKraStatus: jest.fn(),
};

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
  set: jest.fn(),
  getAll: jest.fn(),
};

const mockAdminService = {
  getKraSyncLogs: jest.fn(),
  getDashboardStats: jest.fn(),
  getRevenueStats: jest.fn(),
  getUsersGrowth: jest.fn(),
  getPredictionTicketUsage: jest.fn(),
  getTicketUsageTrend: jest.fn(),
  getSubscriptionPlanById: jest.fn(),
};

const mockSubscriptionsService = {
  getPlansAdmin: jest.fn(),
  createPlan: jest.fn(),
  updatePlan: jest.fn(),
  deletePlan: jest.fn(),
};

const mockNotificationsService = {
  findAllAdmin: jest.fn(),
  adminSend: jest.fn(),
};

const mockSinglePurchasesService = {
  getConfig: jest.fn(),
  updateConfig: jest.fn(),
  calculatePrice: jest.fn(),
};

const mockPredictionTicketsService = {
  grantTickets: jest.fn(),
};

const mockActivityLogsService = {
  getAdminLogs: jest.fn(),
  getUserLogs: jest.fn(),
  getUserActivitySummary: jest.fn(),
};

const mockWeeklyPreviewService = {
  generate: jest.fn(),
  getLatest: jest.fn(),
};

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: KraService, useValue: mockKraService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: GlobalConfigService, useValue: mockConfigService },
        { provide: AdminService, useValue: mockAdminService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: SinglePurchasesService, useValue: mockSinglePurchasesService },
        { provide: PredictionTicketsService, useValue: mockPredictionTicketsService },
        { provide: ActivityLogsService, useValue: mockActivityLogsService },
        { provide: WeeklyPreviewService, useValue: mockWeeklyPreviewService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(AdminActivityInterceptor)
      .useValue({ intercept: (_ctx: unknown, next: { handle: () => unknown }) => next.handle() })
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- KRA Sync ---

  describe('syncSchedule', () => {
    it('should delegate to syncScheduleForDate when date provided', async () => {
      const expected = { races: 5, entries: 40 };
      mockKraService.syncScheduleForDate.mockResolvedValue(expected);

      const result = await controller.syncSchedule('20250301');

      expect(mockKraService.syncScheduleForDate).toHaveBeenCalledWith('20250301');
      expect(result).toEqual(expected);
    });

    it('should delegate to fetchRacePlanScheduleForYear when valid year provided', async () => {
      const expected = { months: 12 };
      mockKraService.fetchRacePlanScheduleForYear.mockResolvedValue(expected);

      const result = await controller.syncSchedule(undefined, '2025');

      expect(mockKraService.fetchRacePlanScheduleForYear).toHaveBeenCalledWith(2025);
      expect(result).toEqual(expected);
    });

    it('should delegate to syncUpcomingSchedules when no params', async () => {
      const expected = { synced: 10 };
      mockKraService.syncUpcomingSchedules.mockResolvedValue(expected);

      const result = await controller.syncSchedule();

      expect(mockKraService.syncUpcomingSchedules).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('syncResults', () => {
    it('should sync results and backfill entry sheet for specific date', async () => {
      mockKraService.fetchRaceResults.mockResolvedValue({
        message: '10 results',
        totalResults: 10,
      });
      mockKraService.syncEntrySheet.mockResolvedValue({ races: 5, entries: 40 });

      const result = await controller.syncResults('20250301');

      expect(mockKraService.fetchRaceResults).toHaveBeenCalledWith('20250301', true);
      expect(mockKraService.syncEntrySheet).toHaveBeenCalledWith('20250301');
      expect(result).toMatchObject({ totalResults: 10, entries: 40 });
    });

    it('should return results with warning when entry sheet fails', async () => {
      mockKraService.fetchRaceResults.mockResolvedValue({
        message: '10 results',
        totalResults: 10,
      });
      mockKraService.syncEntrySheet.mockRejectedValue(new Error('No data'));

      const result = await controller.syncResults('20250301');

      expect(result).toMatchObject({ totalResults: 10, entrySheetWarning: 'No data' });
    });
  });

  describe('syncDetails', () => {
    it('should delegate to kraService.syncAnalysisData', async () => {
      const expected = { synced: 5 };
      mockKraService.syncAnalysisData.mockResolvedValue(expected);

      const result = await controller.syncDetails('20250301');

      expect(mockKraService.syncAnalysisData).toHaveBeenCalledWith('20250301');
      expect(result).toEqual(expected);
    });
  });

  describe('getKraStatus', () => {
    it('should delegate to kraService.getKraStatus', async () => {
      const expected = { baseUrl: 'https://kra.example.com', hasKey: true };
      mockKraService.getKraStatus.mockResolvedValue(expected);

      const result = await controller.getKraStatus();

      expect(mockKraService.getKraStatus).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('getKraSyncLogs', () => {
    it('should delegate to adminService.getKraSyncLogs', async () => {
      const expected = { logs: [], total: 0 };
      mockAdminService.getKraSyncLogs.mockResolvedValue(expected);

      const result = await controller.getKraSyncLogs('sync', '20250301', 50);

      expect(mockAdminService.getKraSyncLogs).toHaveBeenCalledWith('sync', '20250301', 50);
      expect(result).toEqual(expected);
    });
  });

  describe('getKraBatchSchedules', () => {
    it('should delegate to kraService.getBatchSchedules', async () => {
      const expected = { schedules: [] };
      mockKraService.getBatchSchedules.mockResolvedValue(expected);

      const result = await controller.getKraBatchSchedules('PENDING', 10);

      expect(mockKraService.getBatchSchedules).toHaveBeenCalledWith({
        status: 'PENDING',
        limit: 10,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('seedSample', () => {
    it('should delegate to kraService.seedSampleRaces', async () => {
      mockKraService.seedSampleRaces.mockResolvedValue({ created: 3 });

      const result = await controller.seedSample('20250301');

      expect(mockKraService.seedSampleRaces).toHaveBeenCalledWith('20250301');
      expect(result).toEqual({ created: 3 });
    });
  });

  describe('syncJockeys', () => {
    it('should delegate to kraService.fetchJockeyTotalResults', async () => {
      mockKraService.fetchJockeyTotalResults.mockResolvedValue({ jockeys: 20 });

      const result = await controller.syncJockeys('SEOUL');

      expect(mockKraService.fetchJockeyTotalResults).toHaveBeenCalledWith('SEOUL');
      expect(result).toEqual({ jockeys: 20 });
    });
  });

  describe('syncAll', () => {
    it('should delegate to kraService.syncAll', async () => {
      const expected = { message: 'All synced' };
      mockKraService.syncAll.mockResolvedValue(expected);

      const result = await controller.syncAll('20250301');

      expect(mockKraService.syncAll).toHaveBeenCalledWith('20250301');
      expect(result).toEqual(expected);
    });
  });

  describe('generatePredictionsForDate', () => {
    it('should delegate to kraService.generatePredictionsForDate', async () => {
      const expected = { generated: 10 };
      mockKraService.generatePredictionsForDate.mockResolvedValue(expected);

      const result = await controller.generatePredictionsForDate('20250301');

      expect(mockKraService.generatePredictionsForDate).toHaveBeenCalledWith('20250301');
      expect(result).toEqual(expected);
    });
  });

  describe('syncHistorical', () => {
    it('should delegate to kraService.syncHistoricalBackfill', async () => {
      const expected = { synced: 100 };
      mockKraService.syncHistoricalBackfill.mockResolvedValue(expected);

      const result = await controller.syncHistorical('20240101', '20240131');

      expect(mockKraService.syncHistoricalBackfill).toHaveBeenCalledWith('20240101', '20240131');
      expect(result).toEqual(expected);
    });

    it('should throw when dateFrom or dateTo is missing', async () => {
      await expect(
        controller.syncHistorical('', '20240131'),
      ).rejects.toThrow();
    });
  });

  // --- SSE Stream Endpoints ---

  describe('syncResultsStream', () => {
    it('should set SSE headers and stream results', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as import('express').Response;

      mockKraService.fetchRaceResults.mockResolvedValue({ totalResults: 5 });
      mockKraService.syncEntrySheet.mockResolvedValue({ races: 3, entries: 20 });

      await controller.syncResultsStream('20250301', mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should return 400 when date is missing', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as import('express').Response;

      await controller.syncResultsStream('', mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });
  });

  // --- User Management ---

  describe('getUsers', () => {
    it('should delegate to usersService.findAll and shape response', async () => {
      mockUsersService.findAll.mockResolvedValue({
        users: [{ id: 1 }],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await controller.getUsers(1, 20, 'USER', 'test');

      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        role: 'USER',
        search: 'test',
      });
      expect(result).toEqual({
        data: [{ id: 1 }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
    });
  });

  describe('getUser', () => {
    it('should delegate to usersService.findOne', async () => {
      const expected = { id: 1, email: 'test@test.com' };
      mockUsersService.findOne.mockResolvedValue(expected);

      const result = await controller.getUser(1);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('updateUser', () => {
    it('should delegate to usersService.update', async () => {
      const dto = { name: 'New Name' } as never;
      mockUsersService.update.mockResolvedValue({ id: 1, name: 'New Name' });

      const result = await controller.updateUser(1, dto);

      expect(mockUsersService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toMatchObject({ name: 'New Name' });
    });
  });

  describe('deleteUser', () => {
    it('should delegate to usersService.remove', async () => {
      mockUsersService.remove.mockResolvedValue({ affected: 1 });

      const result = await controller.deleteUser(1);

      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ affected: 1 });
    });
  });

  describe('activateUser', () => {
    it('should delegate to usersService.update with isActive=true', async () => {
      mockUsersService.update.mockResolvedValue({ id: 1, isActive: true });

      const result = await controller.activateUser(1);

      expect(mockUsersService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ isActive: true }),
      );
      expect(result).toMatchObject({ isActive: true });
    });
  });

  describe('deactivateUser', () => {
    it('should delegate to usersService.update with isActive=false', async () => {
      mockUsersService.update.mockResolvedValue({ id: 1, isActive: false });

      const result = await controller.deactivateUser(1);

      expect(mockUsersService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ isActive: false }),
      );
      expect(result).toMatchObject({ isActive: false });
    });
  });

  describe('grantTickets', () => {
    it('should delegate to predictionTicketsService.grantTickets', async () => {
      const expected = { granted: 5 };
      mockPredictionTicketsService.grantTickets.mockResolvedValue(expected);

      const result = await controller.grantTickets(1, {
        count: 5,
        expiresInDays: 30,
        type: 'RACE',
      });

      expect(mockPredictionTicketsService.grantTickets).toHaveBeenCalledWith(1, 5, 30, 'RACE');
      expect(result).toEqual(expected);
    });

    it('should default to RACE type when MATRIX not specified', async () => {
      mockPredictionTicketsService.grantTickets.mockResolvedValue({ granted: 1 });

      await controller.grantTickets(1, { count: 1 });

      expect(mockPredictionTicketsService.grantTickets).toHaveBeenCalledWith(
        1,
        1,
        30,
        'RACE',
      );
    });

    it('should cap count at 100', async () => {
      mockPredictionTicketsService.grantTickets.mockResolvedValue({ granted: 100 });

      await controller.grantTickets(1, { count: 999 });

      expect(mockPredictionTicketsService.grantTickets).toHaveBeenCalledWith(
        1,
        100,
        30,
        'RACE',
      );
    });
  });

  // --- AI Config ---

  describe('getAIConfig', () => {
    it('should return defaults when no config stored', async () => {
      mockConfigService.get.mockResolvedValue(null);

      const result = await controller.getAIConfig();

      expect(result).toMatchObject({
        llmProvider: 'gemini',
        primaryModel: 'gemini-2.5-flash',
        enableCaching: true,
      });
    });

    it('should merge stored config with defaults', async () => {
      mockConfigService.get.mockResolvedValue(
        JSON.stringify({ primaryModel: 'gemini-1.5-pro', temperature: 0.5 }),
      );

      const result = await controller.getAIConfig();

      expect(result).toMatchObject({
        primaryModel: 'gemini-1.5-pro',
        temperature: 0.5,
        llmProvider: 'gemini',
      });
    });
  });

  describe('updateAIConfig', () => {
    it('should save config and return body', async () => {
      const body = { primaryModel: 'gemini-1.5-pro' };
      mockConfigService.set.mockResolvedValue(undefined);

      const result = await controller.updateAIConfig(body);

      expect(mockConfigService.set).toHaveBeenCalledWith(
        'ai_config',
        JSON.stringify(body),
      );
      expect(result).toEqual(body);
    });
  });

  describe('getSystemConfig', () => {
    it('should return system config from configService', async () => {
      mockConfigService.getAll.mockResolvedValue({
        kra_base_url_override: 'https://kra.test.com',
        signup_bonus_tickets: '2',
      });

      const result = await controller.getSystemConfig();

      expect(result).toMatchObject({
        kra_base_url_override: 'https://kra.test.com',
        signup_bonus_tickets: '2',
      });
    });
  });

  describe('updateSystemConfig', () => {
    it('should set each provided key', async () => {
      mockConfigService.set.mockResolvedValue(undefined);
      mockConfigService.getAll.mockResolvedValue({
        kra_base_url_override: 'https://new.url',
        signup_bonus_tickets: '1',
        signup_bonus_expires_days: '30',
        consecutive_streak_days: '7',
        consecutive_streak_tickets: '1',
        consecutive_expires_days: '30',
        matrix_ticket_price: '1000',
      });

      await controller.updateSystemConfig({
        kra_base_url_override: 'https://new.url',
      });

      expect(mockConfigService.set).toHaveBeenCalledWith(
        'kra_base_url_override',
        'https://new.url',
      );
    });
  });

  describe('estimateCost', () => {
    it('should return cost estimate based on config', async () => {
      mockConfigService.get.mockResolvedValue(
        JSON.stringify({ primaryModel: 'gemini-2.5-flash', enableCaching: true }),
      );

      const result = await controller.estimateCost();

      expect(result).toMatchObject({
        primaryModel: 'gemini-2.5-flash',
        enableCaching: true,
        estimatedMonthlyCost: expect.any(Number),
        calculationText: expect.any(String),
      });
    });
  });

  // --- Subscriptions ---

  describe('getSubscriptionPlans', () => {
    it('should delegate to subscriptionsService.getPlansAdmin', async () => {
      const expected = [{ id: 1, planName: 'LIGHT' }];
      mockSubscriptionsService.getPlansAdmin.mockResolvedValue(expected);

      const result = await controller.getSubscriptionPlans();

      expect(mockSubscriptionsService.getPlansAdmin).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('createSubscriptionPlan', () => {
    it('should delegate to subscriptionsService.createPlan', async () => {
      const body = {
        planName: 'TEST',
        displayName: 'Test Plan',
        originalPrice: 9900,
        vat: 900,
        totalPrice: 10800,
        baseTickets: 5,
        bonusTickets: 0,
        totalTickets: 5,
      };
      mockSubscriptionsService.createPlan.mockResolvedValue({ id: 1, ...body });

      const result = await controller.createSubscriptionPlan(body);

      expect(mockSubscriptionsService.createPlan).toHaveBeenCalledWith(body);
      expect(result).toMatchObject({ planName: 'TEST' });
    });
  });

  describe('getSubscriptionPlan', () => {
    it('should delegate to adminService.getSubscriptionPlanById', async () => {
      const expected = { id: 1, planName: 'LIGHT' };
      mockAdminService.getSubscriptionPlanById.mockResolvedValue(expected);

      const result = await controller.getSubscriptionPlan(1);

      expect(mockAdminService.getSubscriptionPlanById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('updateSubscriptionPlan', () => {
    it('should delegate to subscriptionsService.updatePlan', async () => {
      mockSubscriptionsService.updatePlan.mockResolvedValue({ id: 1 });

      const result = await controller.updateSubscriptionPlan(1, { totalPrice: 5000 });

      expect(mockSubscriptionsService.updatePlan).toHaveBeenCalledWith(1, { totalPrice: 5000 });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('deleteSubscriptionPlan', () => {
    it('should delegate to subscriptionsService.deletePlan', async () => {
      mockSubscriptionsService.deletePlan.mockResolvedValue({ affected: 1 });

      const result = await controller.deleteSubscriptionPlan(1);

      expect(mockSubscriptionsService.deletePlan).toHaveBeenCalledWith(1);
      expect(result).toEqual({ affected: 1 });
    });
  });

  // --- Notifications ---

  describe('getNotifications', () => {
    it('should delegate to notificationsService.findAllAdmin', async () => {
      const expected = { data: [], total: 0 };
      mockNotificationsService.findAllAdmin.mockResolvedValue(expected);

      const result = await controller.getNotifications(1, 20);

      expect(mockNotificationsService.findAllAdmin).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result).toEqual(expected);
    });
  });

  describe('sendNotification', () => {
    it('should delegate to notificationsService.adminSend', async () => {
      const body = { title: 'Test', message: 'Hello', target: 'all' };
      mockNotificationsService.adminSend.mockResolvedValue({ sent: 10 });

      const result = await controller.sendNotification(body);

      expect(mockNotificationsService.adminSend).toHaveBeenCalledWith(body);
      expect(result).toEqual({ sent: 10 });
    });
  });

  // --- Single Purchase ---

  describe('getSinglePurchaseConfig', () => {
    it('should delegate to singlePurchasesService.getConfig', async () => {
      const expected = { pricePerTicket: 1000 };
      mockSinglePurchasesService.getConfig.mockResolvedValue(expected);

      const result = await controller.getSinglePurchaseConfig();

      expect(mockSinglePurchasesService.getConfig).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('updateSinglePurchaseConfig', () => {
    it('should delegate to singlePurchasesService.updateConfig', async () => {
      const body = { pricePerTicket: 2000 };
      mockSinglePurchasesService.updateConfig.mockResolvedValue(body);

      const result = await controller.updateSinglePurchaseConfig(body);

      expect(mockSinglePurchasesService.updateConfig).toHaveBeenCalledWith(body);
      expect(result).toEqual(body);
    });
  });

  describe('calculateSinglePurchasePrice', () => {
    it('should delegate to singlePurchasesService.calculatePrice', async () => {
      mockSinglePurchasesService.calculatePrice.mockResolvedValue({ total: 5000 });

      const result = await controller.calculateSinglePurchasePrice(5);

      expect(mockSinglePurchasesService.calculatePrice).toHaveBeenCalledWith(5);
      expect(result).toEqual({ total: 5000 });
    });

    it('should default to quantity 1 when not provided', async () => {
      mockSinglePurchasesService.calculatePrice.mockResolvedValue({ total: 1000 });

      await controller.calculateSinglePurchasePrice();

      expect(mockSinglePurchasesService.calculatePrice).toHaveBeenCalledWith(1);
    });
  });

  // --- Statistics ---

  describe('getDashboardStats', () => {
    it('should delegate to adminService.getDashboardStats', async () => {
      const expected = { totalUsers: 100 };
      mockAdminService.getDashboardStats.mockResolvedValue(expected);

      const result = await controller.getDashboardStats();

      expect(mockAdminService.getDashboardStats).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('getRevenueStats', () => {
    it('should delegate to adminService.getRevenueStats', async () => {
      const expected = { revenue: 50000 };
      mockAdminService.getRevenueStats.mockResolvedValue(expected);

      const result = await controller.getRevenueStats('monthly');

      expect(mockAdminService.getRevenueStats).toHaveBeenCalledWith('monthly');
      expect(result).toEqual(expected);
    });
  });

  describe('getUsersGrowth', () => {
    it('should delegate to adminService.getUsersGrowth with capped days', async () => {
      mockAdminService.getUsersGrowth.mockResolvedValue({ growth: [] });

      await controller.getUsersGrowth(200);

      expect(mockAdminService.getUsersGrowth).toHaveBeenCalledWith(90);
    });

    it('should default to 30 days', async () => {
      mockAdminService.getUsersGrowth.mockResolvedValue({ growth: [] });

      await controller.getUsersGrowth();

      expect(mockAdminService.getUsersGrowth).toHaveBeenCalledWith(30);
    });
  });

  describe('getPredictionTicketUsage', () => {
    it('should delegate to adminService.getPredictionTicketUsage', async () => {
      const expected = { data: [], total: 0 };
      mockAdminService.getPredictionTicketUsage.mockResolvedValue(expected);

      const result = await controller.getPredictionTicketUsage(1, 20, '5');

      expect(mockAdminService.getPredictionTicketUsage).toHaveBeenCalledWith(1, 20, 5);
      expect(result).toEqual(expected);
    });
  });

  describe('getTicketUsageTrend', () => {
    it('should delegate to adminService.getTicketUsageTrend', async () => {
      mockAdminService.getTicketUsageTrend.mockResolvedValue({ trend: [] });

      await controller.getTicketUsageTrend(14);

      expect(mockAdminService.getTicketUsageTrend).toHaveBeenCalledWith(14);
    });
  });

  // --- Activity Logs ---

  describe('getAdminActivityLogs', () => {
    it('should delegate to activityLogsService.getAdminLogs', async () => {
      const expected = { data: [], total: 0 };
      mockActivityLogsService.getAdminLogs.mockResolvedValue(expected);

      const result = await controller.getAdminActivityLogs(1, 20, 'LOGIN', '99');

      expect(mockActivityLogsService.getAdminLogs).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        action: 'LOGIN',
        adminUserId: 99,
        dateFrom: undefined,
        dateTo: undefined,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getUserActivityLogs', () => {
    it('should delegate to activityLogsService.getUserLogs', async () => {
      const expected = { data: [], total: 0 };
      mockActivityLogsService.getUserLogs.mockResolvedValue(expected);

      const result = await controller.getUserActivityLogs(1, 20, 'PAGE_VIEW', '5');

      expect(mockActivityLogsService.getUserLogs).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        event: 'PAGE_VIEW',
        userId: 5,
        dateFrom: undefined,
        dateTo: undefined,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getUserActivitySummary', () => {
    it('should delegate to activityLogsService.getUserActivitySummary', async () => {
      const expected = { totalEvents: 100 };
      mockActivityLogsService.getUserActivitySummary.mockResolvedValue(expected);

      const result = await controller.getUserActivitySummary(5);

      expect(mockActivityLogsService.getUserActivitySummary).toHaveBeenCalledWith(5);
      expect(result).toEqual(expected);
    });
  });

  // --- Weekly Preview ---

  describe('generateWeeklyPreview', () => {
    it('should delegate to weeklyPreviewService.generate', async () => {
      const expected = { id: '1', content: 'preview' };
      mockWeeklyPreviewService.generate.mockResolvedValue(expected);

      const result = await controller.generateWeeklyPreview();

      expect(mockWeeklyPreviewService.generate).toHaveBeenCalledWith({
        fromDate: undefined,
      });
      expect(result).toEqual(expected);
    });

    it('should pass parsed date when provided', async () => {
      mockWeeklyPreviewService.generate.mockResolvedValue({ id: '1' });

      await controller.generateWeeklyPreview('2025-03-01');

      expect(mockWeeklyPreviewService.generate).toHaveBeenCalledWith({
        fromDate: expect.any(Date),
      });
    });
  });

  describe('getLatestWeeklyPreview', () => {
    it('should delegate to weeklyPreviewService.getLatest', async () => {
      const expected = { id: '1', content: 'latest preview' };
      mockWeeklyPreviewService.getLatest.mockResolvedValue(expected);

      const result = await controller.getLatestWeeklyPreview();

      expect(mockWeeklyPreviewService.getLatest).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });
});
