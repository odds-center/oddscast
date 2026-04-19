import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { BillingHistory } from '../database/entities/billing-history.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DiscordService } from '../discord/discord.service';
import { SubscriptionStatus, PaymentStatus } from '../database/db-enums';

const mockDiscordService = {
  notifySubscriptionPayment: jest.fn().mockResolvedValue(undefined),
  notifyRecurringBilling: jest.fn().mockResolvedValue(undefined),
  notifyTicketPurchase: jest.fn().mockResolvedValue(undefined),
};

const mockSubscriptionRepo = {
  findOne: jest.fn(),
  update: jest.fn(),
};
const mockPlanRepo = { findOne: jest.fn() };
const mockBillingHistoryRepo = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockPredictionTicketRepo = { create: jest.fn(), save: jest.fn() };
const mockSubscriptionsService = { activate: jest.fn() };

/** ConfigService with no TOSSPAYMENTS_SECRET_KEY → tossClient stays null */
const mockConfigNoKey = { get: jest.fn().mockReturnValue(undefined) };

async function buildService(configMock: object): Promise<PaymentsService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PaymentsService,
      {
        provide: getRepositoryToken(Subscription),
        useValue: mockSubscriptionRepo,
      },
      { provide: getRepositoryToken(SubscriptionPlan), useValue: mockPlanRepo },
      {
        provide: getRepositoryToken(BillingHistory),
        useValue: mockBillingHistoryRepo,
      },
      {
        provide: getRepositoryToken(PredictionTicket),
        useValue: mockPredictionTicketRepo,
      },
      { provide: ConfigService, useValue: configMock },
      { provide: SubscriptionsService, useValue: mockSubscriptionsService },
      { provide: DiscordService, useValue: mockDiscordService },
    ],
  }).compile();
  return module.get<PaymentsService>(PaymentsService);
}

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await buildService(mockConfigNoKey);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------------------
  // getHistory
  // -------------------------------------------------------------------
  describe('getHistory', () => {
    it('returns billing history for the user', async () => {
      const history = [{ id: 1, amount: 9900 }];
      mockBillingHistoryRepo.find.mockResolvedValue(history);

      const result = await service.getHistory(1);

      expect(result).toEqual(history);
      expect(mockBillingHistoryRepo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // -------------------------------------------------------------------
  // processSubscription
  // -------------------------------------------------------------------
  describe('processSubscription', () => {
    it('saves a billing record and returns planName', async () => {
      mockPlanRepo.findOne.mockResolvedValue({
        totalPrice: 9900,
        displayName: '스탠다드',
      });
      const billing = { id: 1 };
      mockBillingHistoryRepo.create.mockReturnValue(billing);
      mockBillingHistoryRepo.save.mockResolvedValue(billing);

      const result = await service.processSubscription(1, {
        planId: '1',
        paymentMethod: 'card',
      });

      expect(result.planName).toBe('스탠다드');
      expect(mockBillingHistoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.SUCCESS }),
      );
    });

    it('throws NotFoundException when plan does not exist', async () => {
      mockPlanRepo.findOne.mockResolvedValue(null);

      await expect(
        service.processSubscription(1, { planId: '99', paymentMethod: 'card' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // -------------------------------------------------------------------
  // processPurchase
  // -------------------------------------------------------------------
  describe('processPurchase', () => {
    it('saves a billing record and returns billing', async () => {
      const billing = { id: 2, amount: 1000 };
      mockBillingHistoryRepo.create.mockReturnValue(billing);
      mockBillingHistoryRepo.save.mockResolvedValue(billing);

      const result = await service.processPurchase(1, {
        amount: 1000,
        paymentMethod: 'tosspayments',
        pgTransactionId: 'pay_abc',
      });

      expect(result.billing).toEqual(billing);
      expect(mockBillingHistoryRepo.save).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------
  // issueBillingKeyAndConfirmSubscription — validation paths
  // -------------------------------------------------------------------
  describe('issueBillingKeyAndConfirmSubscription', () => {
    const baseDto = {
      subscriptionId: '1',
      customerKey: 'cust-001',
      authKey: 'auth-xyz',
    };

    it('throws BadRequestException for non-numeric subscriptionId', async () => {
      await expect(
        service.issueBillingKeyAndConfirmSubscription(1, {
          ...baseDto,
          subscriptionId: 'abc',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when subscription does not exist', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.issueBillingKeyAndConfirmSubscription(1, baseDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when userId does not match', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 99,
        status: SubscriptionStatus.PENDING,
        plan: {
          totalPrice: 9900,
          displayName: '스탠다드',
          planName: 'STANDARD',
        },
        user: { email: 'a@b.com', name: '홍길동' },
      });

      await expect(
        service.issueBillingKeyAndConfirmSubscription(7, baseDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException when subscription is not PENDING', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        status: SubscriptionStatus.ACTIVE,
        plan: {
          totalPrice: 9900,
          displayName: '스탠다드',
          planName: 'STANDARD',
        },
        user: { email: 'a@b.com', name: '홍길동' },
      });

      await expect(
        service.issueBillingKeyAndConfirmSubscription(1, baseDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when tossClient is not configured', async () => {
      // service built with mockConfigNoKey → tossClient === null
      mockSubscriptionRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        customerKey: null,
        status: SubscriptionStatus.PENDING,
        plan: {
          totalPrice: 9900,
          displayName: '스탠다드',
          planName: 'STANDARD',
        },
        user: { email: 'a@b.com', name: '홍길동' },
      });

      await expect(
        service.issueBillingKeyAndConfirmSubscription(1, baseDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // -------------------------------------------------------------------
  // requestRecurringBilling — early-return paths
  // -------------------------------------------------------------------
  describe('requestRecurringBilling', () => {
    it('returns false when subscription is not found', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue(null);
      const result = await service.requestRecurringBilling(999);
      expect(result).toBe(false);
    });

    it('returns false when subscription is not ACTIVE', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue({
        id: 1,
        status: SubscriptionStatus.CANCELLED,
        billingKey: 'bk-1',
        customerKey: 'ck-1',
        plan: { totalPrice: 9900 },
      });
      const result = await service.requestRecurringBilling(1);
      expect(result).toBe(false);
    });

    it('returns false when subscription has no billingKey', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue({
        id: 1,
        status: SubscriptionStatus.ACTIVE,
        billingKey: null,
        customerKey: 'ck-1',
        plan: { totalPrice: 9900 },
      });
      const result = await service.requestRecurringBilling(1);
      expect(result).toBe(false);
    });

    it('returns false when tossClient is not configured', async () => {
      // service with no secret key → tossClient null
      mockSubscriptionRepo.findOne.mockResolvedValue({
        id: 1,
        status: SubscriptionStatus.ACTIVE,
        billingKey: 'bk-1',
        customerKey: 'ck-1',
        plan: {
          totalPrice: 9900,
          displayName: '스탠다드',
          planName: 'STANDARD',
        },
        user: { email: 'a@b.com', name: '홍길동' },
      });
      const result = await service.requestRecurringBilling(1);
      expect(result).toBe(false);
    });
  });
});
