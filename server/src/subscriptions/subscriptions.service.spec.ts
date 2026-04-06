import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { SubscriptionStatus } from '../database/db-enums';
import {
  createMockRepository,
  createMockDataSource,
  createMockQueryBuilder,
} from '../test/mock-factories';
import {
  createTestSubscription,
  createTestSubscriptionPlan,
} from '../test/test-entities';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  const subscriptionRepo = createMockRepository();
  const planRepo = createMockRepository();
  const predictionTicketRepo = createMockRepository();
  const dataSource = createMockDataSource();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepo,
        },
        { provide: getRepositoryToken(SubscriptionPlan), useValue: planRepo },
        {
          provide: getRepositoryToken(PredictionTicket),
          useValue: predictionTicketRepo,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('subscribe', () => {
    it('should create PENDING subscription', async () => {
      subscriptionRepo.findOne
        .mockResolvedValueOnce(null) // hasActive check
        .mockResolvedValueOnce(null) // hasPending check
        .mockResolvedValueOnce({
          ...createTestSubscription(),
          plan: createTestSubscriptionPlan(),
        }); // final find
      const plan = createTestSubscriptionPlan();
      planRepo.findOne.mockResolvedValue(plan);
      subscriptionRepo.create.mockReturnValue(createTestSubscription());
      subscriptionRepo.save.mockResolvedValue(createTestSubscription());

      const result = await service.subscribe(1, { planId: 1 });

      expect(result).toBeDefined();
      expect(subscriptionRepo.save).toHaveBeenCalled();
    });

    it('should throw when active subscription exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        createTestSubscription({ status: SubscriptionStatus.ACTIVE }),
      );

      await expect(service.subscribe(1, { planId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when plan is inactive', async () => {
      subscriptionRepo.findOne
        .mockResolvedValueOnce(null) // hasActive check
        .mockResolvedValueOnce(null); // hasPending check
      planRepo.findOne.mockResolvedValue(
        createTestSubscriptionPlan({ isActive: false }),
      );

      await expect(service.subscribe(1, { planId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activate', () => {
    it('should change to ACTIVE and issue RACE+MATRIX tickets in transaction', async () => {
      const plan = createTestSubscriptionPlan({
        totalTickets: 3,
        matrixTickets: 2,
      });
      const sub = createTestSubscription({
        status: SubscriptionStatus.PENDING,
        userId: 1,
        plan,
      });
      subscriptionRepo.findOne
        .mockResolvedValueOnce(sub) // initial find
        .mockResolvedValueOnce({
          ...sub,
          status: SubscriptionStatus.ACTIVE,
          plan,
        }); // final find

      const mockTicketRepo = createMockRepository();
      const mockSubRepo = createMockRepository();
      dataSource._manager.getRepository.mockImplementation(
        (entity: unknown) => {
          if (entity === PredictionTicket) return mockTicketRepo;
          return mockSubRepo;
        },
      );

      const result = await service.activate(1, 1, {});

      expect(dataSource.transaction).toHaveBeenCalled();
      // 3 RACE tickets + 2 MATRIX tickets = 5 saves
      expect(mockTicketRepo.save).toHaveBeenCalledTimes(5);
      expect(result.ticketsIssued).toBe(3);
      expect(result.matrixTicketsIssued).toBe(2);
    });

    it('should throw when not PENDING', async () => {
      const sub = createTestSubscription({
        status: SubscriptionStatus.ACTIVE,
        userId: 1,
        plan: createTestSubscriptionPlan(),
      });
      subscriptionRepo.findOne.mockResolvedValue(sub);

      await expect(service.activate(1, 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('should change to CANCELLED with reason', async () => {
      const plan = createTestSubscriptionPlan();
      const sub = createTestSubscription({
        status: SubscriptionStatus.ACTIVE,
        userId: 1,
        plan,
      });
      subscriptionRepo.findOne
        .mockResolvedValueOnce(sub) // initial find
        .mockResolvedValueOnce({
          ...sub,
          status: SubscriptionStatus.CANCELLED,
          plan,
        }); // final find

      const result = await service.cancel(1, 1, { reason: 'Too expensive' });

      expect(subscriptionRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: SubscriptionStatus.CANCELLED,
          cancelReason: 'Too expensive',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw when already cancelled', async () => {
      const sub = createTestSubscription({
        status: SubscriptionStatus.CANCELLED,
        userId: 1,
      });
      subscriptionRepo.findOne.mockResolvedValue(sub);

      await expect(service.cancel(1, 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when not ACTIVE', async () => {
      const sub = createTestSubscription({
        status: SubscriptionStatus.PENDING,
        userId: 1,
      });
      subscriptionRepo.findOne.mockResolvedValue(sub);

      await expect(service.cancel(1, 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStatus', () => {
    it('should return isActive=true with remaining tickets', async () => {
      const plan = createTestSubscriptionPlan({ totalTickets: 10 });
      const sub = createTestSubscription({
        status: SubscriptionStatus.ACTIVE,
        userId: 1,
        plan,
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      });
      subscriptionRepo.findOne.mockResolvedValue(sub);
      const ticketQb = createMockQueryBuilder();
      ticketQb.getCount.mockResolvedValue(7);
      predictionTicketRepo.createQueryBuilder.mockReturnValue(ticketQb);

      const result = await service.getStatus(1);

      expect(result.isActive).toBe(true);
      expect(result.remainingTickets).toBe(7);
      expect(result.daysUntilRenewal).toBeGreaterThan(0);
    });

    it('should return isActive=false when no subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      const result = await service.getStatus(1);

      expect(result.isActive).toBe(false);
      expect(result.remainingTickets).toBe(0);
    });
  });

  describe('getPlans', () => {
    it('should return active plans', async () => {
      const plans = [createTestSubscriptionPlan()];
      planRepo.find.mockResolvedValue(plans);

      const result = await service.getPlans();

      expect(result).toEqual(plans);
      expect(planRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });
  });

  describe('createPlan', () => {
    it('should create a new plan', async () => {
      planRepo.findOne.mockResolvedValue(null);
      const plan = createTestSubscriptionPlan({ planName: 'NEW' });
      planRepo.create.mockReturnValue(plan);
      planRepo.save.mockResolvedValue(plan);

      const result = await service.createPlan({
        planName: 'NEW',
        displayName: 'New Plan',
        originalPrice: 10000,
        vat: 1000,
        totalPrice: 10000,
        baseTickets: 5,
        bonusTickets: 0,
        totalTickets: 5,
      });

      expect(result).toBeDefined();
    });
  });

  describe('deletePlan', () => {
    it('should deactivate instead of deleting when subscriptions exist', async () => {
      const plan = createTestSubscriptionPlan();
      planRepo.findOne
        .mockResolvedValueOnce(plan) // initial find
        .mockResolvedValueOnce({ ...plan, isActive: false }); // after save
      subscriptionRepo.count.mockResolvedValue(5);

      const result = await service.deletePlan(1);

      expect(planRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(planRepo.delete).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('cancel (edge cases)', () => {
    it('should throw when subscription not found', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      await expect(service.cancel(999, 1, { reason: 'test' })).rejects.toThrow(
        '구독을 찾을 수 없습니다.',
      );
    });

    it('should throw when cancelling another users subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        createTestSubscription({ userId: 2 }),
      );

      await expect(service.cancel(1, 1, { reason: 'test' })).rejects.toThrow(
        '본인의 구독만 취소할 수 있습니다.',
      );
    });

    it('should throw when already cancelled', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        createTestSubscription({ userId: 1, status: 'CANCELLED' }),
      );

      await expect(service.cancel(1, 1, { reason: 'test' })).rejects.toThrow(
        '이미 취소된 구독입니다.',
      );
    });

    it('should throw when subscription is not active', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        createTestSubscription({ userId: 1, status: 'EXPIRED' }),
      );

      await expect(service.cancel(1, 1, { reason: 'test' })).rejects.toThrow(
        '활성 구독만 취소할 수 있습니다.',
      );
    });

    it('should update status to CANCELLED with reason', async () => {
      const sub = createTestSubscription({ userId: 1, status: 'ACTIVE' });
      subscriptionRepo.findOne
        .mockResolvedValueOnce(sub)
        .mockResolvedValueOnce({
          ...sub,
          status: 'CANCELLED',
          cancelReason: 'Too expensive',
          plan: createTestSubscriptionPlan(),
        });

      await service.cancel(1, 1, { reason: 'Too expensive' });

      expect(subscriptionRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'CANCELLED',
          cancelReason: 'Too expensive',
        }),
      );
    });
  });

  describe('getStatus', () => {
    it('should return inactive when no active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      const status = await service.getStatus(1);

      expect(status.isActive).toBe(false);
      expect(status.planId).toBeNull();
      expect(status.monthlyTickets).toBe(0);
    });
  });
});
