import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../common/decorators/current-user.decorator';

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@test.com',
  role: 'USER' as never,
};

const mockPaymentsService = {
  issueBillingKeyAndConfirmSubscription: jest.fn(),
  processSubscription: jest.fn(),
  processPurchase: jest.fn(),
  getHistory: jest.fn(),
};

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  describe('issueBillingKeyAndConfirm', () => {
    it('should issue billing key and confirm subscription', async () => {
      const dto = { customerKey: 'ck_1', authKey: 'ak_1' };
      const expected = { billingKey: 'bk_1', subscriptionId: 's1' };
      mockPaymentsService.issueBillingKeyAndConfirmSubscription.mockResolvedValue(
        expected,
      );

      const result = await controller.issueBillingKeyAndConfirm(
        mockUser,
        dto as never,
      );

      expect(
        mockPaymentsService.issueBillingKeyAndConfirmSubscription,
      ).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe('processSubscription', () => {
    it('should process subscription payment', async () => {
      const dto = { planId: 'plan_1', paymentMethod: 'card' };
      const expected = { success: true };
      mockPaymentsService.processSubscription.mockResolvedValue(expected);

      const result = await controller.processSubscription(
        mockUser,
        dto as never,
      );

      expect(mockPaymentsService.processSubscription).toHaveBeenCalledWith(
        1,
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('processPurchase', () => {
    it('should process single purchase', async () => {
      const dto = { amount: 1000, type: 'MATRIX' };
      const expected = { success: true, ticketId: 't1' };
      mockPaymentsService.processPurchase.mockResolvedValue(expected);

      const result = await controller.processPurchase(mockUser, dto as never);

      expect(mockPaymentsService.processPurchase).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe('getHistory', () => {
    it('should return payment history for current user', async () => {
      const history = [{ id: 1, amount: 9900 }];
      mockPaymentsService.getHistory.mockResolvedValue(history);

      const result = await controller.getHistory(mockUser);

      expect(mockPaymentsService.getHistory).toHaveBeenCalledWith(1);
      expect(result).toBe(history);
    });
  });
});
