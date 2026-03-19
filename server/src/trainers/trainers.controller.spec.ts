import { Test, TestingModule } from '@nestjs/testing';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';

const mockService = {
  getProfile: jest.fn(),
  getHistory: jest.fn(),
};

describe('TrainersController', () => {
  let controller: TrainersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainersController],
      providers: [{ provide: TrainersService, useValue: mockService }],
    }).compile();

    controller = module.get<TrainersController>(TrainersController);
  });

  describe('getProfile', () => {
    it('should delegate to service with decoded trName', async () => {
      const profile = { trName: 'Kim', totalRaces: 200 };
      mockService.getProfile.mockResolvedValue(profile);

      const response = await controller.getProfile('Kim');

      expect(response).toEqual(profile);
      expect(mockService.getProfile).toHaveBeenCalledWith('Kim');
    });

    it('should decode URI-encoded trainer name', async () => {
      const encoded = encodeURIComponent('홍길동');
      mockService.getProfile.mockResolvedValue({ trName: '홍길동' });

      await controller.getProfile(encoded);

      expect(mockService.getProfile).toHaveBeenCalledWith('홍길동');
    });
  });

  describe('getHistory', () => {
    it('should delegate to service with decoded name and parsed pagination', async () => {
      const history = { data: [], total: 0 };
      mockService.getHistory.mockResolvedValue(history);

      const response = await controller.getHistory('Kim', '2', '15');

      expect(response).toEqual(history);
      expect(mockService.getHistory).toHaveBeenCalledWith('Kim', 2, 15);
    });

    it('should default page to 1 and limit to 20', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('Kim');

      expect(mockService.getHistory).toHaveBeenCalledWith('Kim', 1, 20);
    });

    it('should clamp limit to max 50', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('Kim', '1', '100');

      expect(mockService.getHistory).toHaveBeenCalledWith('Kim', 1, 50);
    });

    it('should clamp page to min 1', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('Kim', '0', '10');

      expect(mockService.getHistory).toHaveBeenCalledWith('Kim', 1, 10);
    });

    it('should decode URI-encoded trainer name in history', async () => {
      const encoded = encodeURIComponent('박조교');
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory(encoded, '1', '10');

      expect(mockService.getHistory).toHaveBeenCalledWith('박조교', 1, 10);
    });
  });
});
