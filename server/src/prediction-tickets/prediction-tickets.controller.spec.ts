import { Test, TestingModule } from '@nestjs/testing';
import { PredictionTicketsController } from './prediction-tickets.controller';
import { PredictionTicketsService } from './prediction-tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const mockUser = { sub: 1, email: 'test@example.com', role: 'USER' };

const mockTicketsService = {
  useTicket: jest.fn(),
  getBalance: jest.fn(),
  checkMatrixAccess: jest.fn(),
  useMatrixTicket: jest.fn(),
  getMatrixBalance: jest.fn(),
  issueMatrixTicketsAfterPayment: jest.fn(),
  getMatrixTicketPrice: jest.fn(),
  getHistory: jest.fn(),
  getMyPredictionsHistory: jest.fn(),
  findOne: jest.fn(),
};

describe('PredictionTicketsController', () => {
  let controller: PredictionTicketsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PredictionTicketsController],
      providers: [
        {
          provide: PredictionTicketsService,
          useValue: mockTicketsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PredictionTicketsController>(
      PredictionTicketsController,
    );
  });

  describe('useTicket', () => {
    it('should delegate to service.useTicket with userId and dto', async () => {
      const dto = { raceId: 1, predictionId: 10 };
      const expected = { status: 'USED', ticketId: 'abc' };
      mockTicketsService.useTicket.mockResolvedValue(expected);
      const mockRes = { status: jest.fn() } as never;

      const result = await controller.useTicket(
        mockUser as never,
        dto as never,
        mockRes,
      );

      expect(mockTicketsService.useTicket).toHaveBeenCalledWith(
        mockUser.sub,
        dto,
      );
      expect(result).toBe(expected);
    });

    it('should set 202 status when result is PREPARING', async () => {
      const dto = { raceId: 1, predictionId: 10 };
      const expected = { status: 'PREPARING' };
      mockTicketsService.useTicket.mockResolvedValue(expected);
      const mockRes = { status: jest.fn() };

      await controller.useTicket(
        mockUser as never,
        dto as never,
        mockRes as never,
      );

      expect(mockRes.status).toHaveBeenCalledWith(202);
    });
  });

  describe('getBalance', () => {
    it('should delegate to service.getBalance with userId', async () => {
      const expected = { race: 3, matrix: 1 };
      mockTicketsService.getBalance.mockResolvedValue(expected);

      const result = await controller.getBalance(mockUser as never);

      expect(mockTicketsService.getBalance).toHaveBeenCalledWith(mockUser.sub);
      expect(result).toBe(expected);
    });
  });

  describe('checkMatrixAccess', () => {
    it('should delegate to service.checkMatrixAccess with userId and date', async () => {
      const expected = { hasAccess: true };
      mockTicketsService.checkMatrixAccess.mockResolvedValue(expected);

      const result = await controller.checkMatrixAccess(
        mockUser as never,
        '2025-03-01',
      );

      expect(mockTicketsService.checkMatrixAccess).toHaveBeenCalledWith(
        mockUser.sub,
        '2025-03-01',
      );
      expect(result).toBe(expected);
    });
  });

  describe('useMatrixTicket', () => {
    it('should delegate to service.useMatrixTicket with userId and date', async () => {
      const expected = { status: 'USED' };
      mockTicketsService.useMatrixTicket.mockResolvedValue(expected);

      const result = await controller.useMatrixTicket(mockUser as never, {
        date: '2025-03-01',
      });

      expect(mockTicketsService.useMatrixTicket).toHaveBeenCalledWith(
        mockUser.sub,
        '2025-03-01',
      );
      expect(result).toBe(expected);
    });
  });

  describe('getMatrixBalance', () => {
    it('should delegate to service.getMatrixBalance with userId', async () => {
      const expected = { balance: 5 };
      mockTicketsService.getMatrixBalance.mockResolvedValue(expected);

      const result = await controller.getMatrixBalance(mockUser as never);

      expect(mockTicketsService.getMatrixBalance).toHaveBeenCalledWith(
        mockUser.sub,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getMatrixPrice', () => {
    it('should delegate to service.getMatrixTicketPrice', () => {
      const expected = {
        pricePerTicket: 1000,
        currency: 'KRW',
        maxPerPurchase: 10,
      };
      mockTicketsService.getMatrixTicketPrice.mockReturnValue(expected);

      const result = controller.getMatrixPrice();

      expect(mockTicketsService.getMatrixTicketPrice).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('getHistory', () => {
    it('should delegate to service.getHistory with userId, page, limit', async () => {
      const expected = { data: [], total: 0 };
      mockTicketsService.getHistory.mockResolvedValue(expected);

      const result = await controller.getHistory(mockUser as never, 2, 10);

      expect(mockTicketsService.getHistory).toHaveBeenCalledWith(
        mockUser.sub,
        2,
        10,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getMyPredictions', () => {
    it('should delegate to service.getMyPredictionsHistory with userId, page, limit', async () => {
      const expected = { data: [], total: 0 };
      mockTicketsService.getMyPredictionsHistory.mockResolvedValue(expected);

      const result = await controller.getMyPredictions(
        mockUser as never,
        1,
        20,
      );

      expect(mockTicketsService.getMyPredictionsHistory).toHaveBeenCalledWith(
        mockUser.sub,
        1,
        20,
      );
      expect(result).toBe(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne with id', async () => {
      const expected = { id: 1, type: 'RACE' };
      mockTicketsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1, mockUser as never);

      expect(mockTicketsService.findOne).toHaveBeenCalledWith(1, mockUser.sub);
      expect(result).toBe(expected);
    });
  });
});
