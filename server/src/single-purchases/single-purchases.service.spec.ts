import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SinglePurchasesService } from './single-purchases.service';
import { SinglePurchase } from '../database/entities/single-purchase.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { GlobalConfigService } from '../config/config.service';
import { TicketStatus, TicketType } from '../database/db-enums';
import {
  createMockRepository,
  createMockConfigService,
} from '../test/mock-factories';

describe('SinglePurchasesService', () => {
  let service: SinglePurchasesService;
  let singlePurchaseRepo: ReturnType<typeof createMockRepository>;
  let predictionTicketRepo: ReturnType<typeof createMockRepository>;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(async () => {
    singlePurchaseRepo = createMockRepository();
    predictionTicketRepo = createMockRepository();
    configService = createMockConfigService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SinglePurchasesService,
        {
          provide: getRepositoryToken(SinglePurchase),
          useValue: singlePurchaseRepo,
        },
        {
          provide: getRepositoryToken(PredictionTicket),
          useValue: predictionTicketRepo,
        },
        { provide: GlobalConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SinglePurchasesService>(SinglePurchasesService);
  });

  describe('purchase', () => {
    it('creates a purchase and issues RACE tickets', async () => {
      const purchase = { id: 'p1', userId: 1, quantity: 2, totalAmount: 1100 };
      singlePurchaseRepo.save.mockResolvedValue(purchase);
      predictionTicketRepo.save.mockResolvedValue({ id: 't1' });

      const result = await service.purchase(1, { quantity: 2 });

      expect(singlePurchaseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, quantity: 2 }),
      );
      expect(predictionTicketRepo.create).toHaveBeenCalledTimes(2);
      expect(predictionTicketRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: TicketType.RACE,
          status: TicketStatus.AVAILABLE,
        }),
      );
      expect(result.ticketsIssued).toBe(2);
    });

    it('defaults quantity to 1 when not provided', async () => {
      singlePurchaseRepo.save.mockResolvedValue({ id: 'p1', userId: 1, quantity: 1 });
      predictionTicketRepo.save.mockResolvedValue({ id: 't1' });

      const result = await service.purchase(1, {});

      expect(predictionTicketRepo.create).toHaveBeenCalledTimes(1);
      expect(result.ticketsIssued).toBe(1);
    });

    it('uses price from config when available', async () => {
      configService.get.mockResolvedValue(
        JSON.stringify({ originalPrice: 500 }),
      );
      singlePurchaseRepo.save.mockResolvedValue({ id: 'p1' });
      predictionTicketRepo.save.mockResolvedValue({ id: 't1' });

      await service.purchase(1, { quantity: 1 });

      expect(singlePurchaseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 550 }), // 500 * 1.1
      );
    });

    it('uses totalPrice from config if originalPrice not set', async () => {
      configService.get.mockResolvedValue(
        JSON.stringify({ totalPrice: 600 }),
      );
      singlePurchaseRepo.save.mockResolvedValue({ id: 'p1' });
      predictionTicketRepo.save.mockResolvedValue({ id: 't1' });

      await service.purchase(1, { quantity: 1 });

      expect(singlePurchaseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 600 }),
      );
    });

    it('falls back to default price when config is missing', async () => {
      configService.get.mockResolvedValue(null);
      singlePurchaseRepo.save.mockResolvedValue({ id: 'p1' });
      predictionTicketRepo.save.mockResolvedValue({ id: 't1' });

      await service.purchase(1, { quantity: 1 });

      // DEFAULT_PRICE_PER_TICKET = 550
      expect(singlePurchaseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 550 }),
      );
    });
  });

  describe('getConfig', () => {
    it('returns parsed config with vat calculation when originalPrice set', async () => {
      configService.get.mockResolvedValue(
        JSON.stringify({ originalPrice: 500, id: 'cfg1' }),
      );

      const result = await service.getConfig();

      expect(result.originalPrice).toBe(500);
      expect(result.vat).toBe(50);
      expect(result.totalPrice).toBe(550);
      expect(result.id).toBe('cfg1');
      expect(result.isActive).toBe(true);
    });

    it('returns default config when config is null', async () => {
      configService.get.mockResolvedValue(null);

      const result = await service.getConfig();

      expect(result.id).toBe('default');
      expect(result.configName).toBe('single_purchase');
      expect(result.isActive).toBe(true);
      expect(result.totalPrice).toBe(550);
    });

    it('returns default config when config JSON is invalid', async () => {
      configService.get.mockResolvedValue('not-json');

      const result = await service.getConfig();

      expect(result.id).toBe('default');
    });
  });

  describe('updateConfig', () => {
    it('merges and saves updated config', async () => {
      configService.get.mockResolvedValue(null); // getConfig returns default

      const result = await service.updateConfig({ originalPrice: 800 });

      expect(configService.set).toHaveBeenCalledWith(
        'single_purchase_config',
        expect.stringContaining('"originalPrice":800'),
      );
      expect(result).toBeDefined();
    });
  });

  describe('calculatePrice', () => {
    it('calculates price for given quantity', async () => {
      configService.get.mockResolvedValue(null); // 550 default

      const result = await service.calculatePrice(3);

      expect(result.unitPrice).toBe(550);
      expect(result.quantity).toBe(3);
      expect(result.subtotal).toBe(1650);
      expect(result.total).toBe(1650);
      expect(result.discount).toBe(0);
    });
  });

  describe('getHistory', () => {
    it('returns paginated purchase history for a user', async () => {
      const mockPurchases = [{ id: 'p1' }, { id: 'p2' }];
      singlePurchaseRepo.findAndCount.mockResolvedValue([mockPurchases, 2]);

      const result = await service.getHistory(1, 1, 20);

      expect(singlePurchaseRepo.findAndCount).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { purchasedAt: 'DESC' },
        take: 20,
        skip: 0,
      });
      expect(result.purchases).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getTotalSpent', () => {
    it('returns total spent and purchase count', async () => {
      singlePurchaseRepo._qb.getRawOne.mockResolvedValue({
        sum: '3300',
        count: '6',
      });

      const result = await service.getTotalSpent(1);

      expect(result.totalSpent).toBe(3300);
      expect(result.totalPurchases).toBe(6);
    });

    it('returns zeros when no purchases', async () => {
      singlePurchaseRepo._qb.getRawOne.mockResolvedValue(null);

      const result = await service.getTotalSpent(99);

      expect(result.totalSpent).toBe(0);
      expect(result.totalPurchases).toBe(0);
    });
  });
});
