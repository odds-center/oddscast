import { Test, TestingModule } from '@nestjs/testing';
import { SinglePurchasesController } from './single-purchases.controller';
import { SinglePurchasesService } from './single-purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';

const mockService = {
  purchase: jest.fn(),
  getConfig: jest.fn(),
  calculatePrice: jest.fn(),
  getHistory: jest.fn(),
  getTotalSpent: jest.fn(),
};

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@example.com',
  role: UserRole.USER,
};

describe('SinglePurchasesController', () => {
  let controller: SinglePurchasesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SinglePurchasesController],
      providers: [
        { provide: SinglePurchasesService, useValue: mockService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller =
      module.get<SinglePurchasesController>(SinglePurchasesController);
  });

  describe('purchase', () => {
    it('should delegate to service with user id and dto', async () => {
      const dto = { quantity: 2 } as never;
      const result = { success: true, ticketCount: 2 };
      mockService.purchase.mockResolvedValue(result);

      const response = await controller.purchase(mockUser, dto);

      expect(response).toEqual(result);
      expect(mockService.purchase).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('purchaseAlias', () => {
    it('should delegate to service.purchase (alias endpoint)', async () => {
      const dto = { quantity: 1 } as never;
      const result = { success: true, ticketCount: 1 };
      mockService.purchase.mockResolvedValue(result);

      const response = await controller.purchaseAlias(mockUser, dto);

      expect(response).toEqual(result);
      expect(mockService.purchase).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('getConfig', () => {
    it('should delegate to service', async () => {
      const config = { pricePerTicket: 1000, maxQuantity: 10 };
      mockService.getConfig.mockResolvedValue(config);

      const response = await controller.getConfig();

      expect(response).toEqual(config);
      expect(mockService.getConfig).toHaveBeenCalled();
    });
  });

  describe('calculatePrice', () => {
    it('should delegate to service with numeric quantity', async () => {
      const result = { totalPrice: 3000 };
      mockService.calculatePrice.mockResolvedValue(result);

      const response = await controller.calculatePrice(3);

      expect(response).toEqual(result);
      expect(mockService.calculatePrice).toHaveBeenCalledWith(3);
    });
  });

  describe('calculatePriceAlias', () => {
    it('should delegate to service.calculatePrice (alias endpoint)', async () => {
      const result = { totalPrice: 5000 };
      mockService.calculatePrice.mockResolvedValue(result);

      const response = await controller.calculatePriceAlias(5);

      expect(response).toEqual(result);
      expect(mockService.calculatePrice).toHaveBeenCalledWith(5);
    });
  });

  describe('getHistory', () => {
    it('should delegate to service with user id and pagination', async () => {
      const result = { data: [], total: 0 };
      mockService.getHistory.mockResolvedValue(result);

      const response = await controller.getHistory(mockUser, 2, 15);

      expect(response).toEqual(result);
      expect(mockService.getHistory).toHaveBeenCalledWith(1, 2, 15);
    });
  });

  describe('getTotalSpent', () => {
    it('should delegate to service with user id', async () => {
      const result = { totalSpent: 25000 };
      mockService.getTotalSpent.mockResolvedValue(result);

      const response = await controller.getTotalSpent(mockUser);

      expect(response).toEqual(result);
      expect(mockService.getTotalSpent).toHaveBeenCalledWith(1);
    });
  });
});
