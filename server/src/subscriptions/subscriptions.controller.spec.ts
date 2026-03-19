import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const mockUser = { sub: 1, email: 'test@example.com', role: 'USER' };

const mockSubscriptionsService = {
  getPlans: jest.fn(),
  getStatus: jest.fn(),
  getHistory: jest.fn(),
  subscribe: jest.fn(),
  cancelByUserId: jest.fn(),
  activate: jest.fn(),
  cancel: jest.fn(),
};

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  describe('getPlans', () => {
    it('should delegate to service.getPlans', async () => {
      const expected = [{ id: 1, planName: 'LIGHT' }];
      mockSubscriptionsService.getPlans.mockResolvedValue(expected);

      const result = await controller.getPlans();

      expect(mockSubscriptionsService.getPlans).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('getStatus', () => {
    it('should delegate to service.getStatus with userId', async () => {
      const expected = { isActive: true, plan: 'STANDARD' };
      mockSubscriptionsService.getStatus.mockResolvedValue(expected);

      const result = await controller.getStatus(mockUser as never);

      expect(mockSubscriptionsService.getStatus).toHaveBeenCalledWith(
        mockUser.sub,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getHistory', () => {
    it('should delegate to service.getHistory with userId, page, limit', async () => {
      const expected = { data: [], total: 0 };
      mockSubscriptionsService.getHistory.mockResolvedValue(expected);

      const result = await controller.getHistory(
        mockUser as never,
        2,
        10,
        undefined,
      );

      expect(mockSubscriptionsService.getHistory).toHaveBeenCalledWith(
        mockUser.sub,
        2,
        10,
      );
      expect(result).toBe(expected);
    });

    it('should compute page from offset when offset is provided', async () => {
      mockSubscriptionsService.getHistory.mockResolvedValue({ data: [] });

      await controller.getHistory(mockUser as never, undefined, 10, 20);

      // offset=20, limit=10 -> page = floor(20/10) + 1 = 3
      expect(mockSubscriptionsService.getHistory).toHaveBeenCalledWith(
        mockUser.sub,
        3,
        10,
      );
    });

    it('should default to page 1 and limit 20 when not provided', async () => {
      mockSubscriptionsService.getHistory.mockResolvedValue({ data: [] });

      await controller.getHistory(
        mockUser as never,
        undefined,
        undefined,
        undefined,
      );

      expect(mockSubscriptionsService.getHistory).toHaveBeenCalledWith(
        mockUser.sub,
        1,
        20,
      );
    });
  });

  describe('subscribe', () => {
    it('should delegate to service.subscribe with userId and dto', async () => {
      const dto = { planId: 1, billingKey: 'key-123' };
      const expected = { id: 1, status: 'PENDING' };
      mockSubscriptionsService.subscribe.mockResolvedValue(expected);

      const result = await controller.subscribe(
        mockUser as never,
        dto as never,
      );

      expect(mockSubscriptionsService.subscribe).toHaveBeenCalledWith(
        mockUser.sub,
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('subscribeAlias', () => {
    it('should delegate to service.subscribe with userId and dto', async () => {
      const dto = { planId: 1 };
      const expected = { id: 1 };
      mockSubscriptionsService.subscribe.mockResolvedValue(expected);

      const result = await controller.subscribeAlias(
        mockUser as never,
        dto as never,
      );

      expect(mockSubscriptionsService.subscribe).toHaveBeenCalledWith(
        mockUser.sub,
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('cancelPost', () => {
    it('should delegate to service.cancelByUserId with userId and reason', async () => {
      const dto = { reason: 'Too expensive' };
      const expected = { cancelled: true };
      mockSubscriptionsService.cancelByUserId.mockResolvedValue(expected);

      const result = await controller.cancelPost(
        mockUser as never,
        dto as never,
      );

      expect(mockSubscriptionsService.cancelByUserId).toHaveBeenCalledWith(
        mockUser.sub,
        'Too expensive',
      );
      expect(result).toBe(expected);
    });
  });

  describe('activate', () => {
    it('should delegate to service.activate with id, userId, and dto', async () => {
      const dto = { paymentKey: 'pay-123', orderId: 'order-1' };
      const expected = { id: 5, status: 'ACTIVE' };
      mockSubscriptionsService.activate.mockResolvedValue(expected);

      const result = await controller.activate(
        mockUser as never,
        5,
        dto as never,
      );

      expect(mockSubscriptionsService.activate).toHaveBeenCalledWith(
        5,
        mockUser.sub,
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('activatePost', () => {
    it('should delegate to service.activate with id, userId, and dto (alias)', async () => {
      const dto = { paymentKey: 'pay-456' };
      const expected = { id: 7, status: 'ACTIVE' };
      mockSubscriptionsService.activate.mockResolvedValue(expected);

      const result = await controller.activatePost(
        mockUser as never,
        7,
        dto as never,
      );

      expect(mockSubscriptionsService.activate).toHaveBeenCalledWith(
        7,
        mockUser.sub,
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('cancel', () => {
    it('should delegate to service.cancel with id, userId, and dto', async () => {
      const dto = { reason: 'Not needed' };
      const expected = { id: 3, status: 'CANCELLED' };
      mockSubscriptionsService.cancel.mockResolvedValue(expected);

      const result = await controller.cancel(
        mockUser as never,
        3,
        dto as never,
      );

      expect(mockSubscriptionsService.cancel).toHaveBeenCalledWith(
        3,
        mockUser.sub,
        dto,
      );
      expect(result).toBe(expected);
    });
  });
});
