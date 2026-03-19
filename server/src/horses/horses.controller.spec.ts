import { Test, TestingModule } from '@nestjs/testing';
import { HorsesController } from './horses.controller';
import { HorsesService } from './horses.service';

const mockService = {
  getProfile: jest.fn(),
  getHistory: jest.fn(),
};

describe('HorsesController', () => {
  let controller: HorsesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HorsesController],
      providers: [{ provide: HorsesService, useValue: mockService }],
    }).compile();

    controller = module.get<HorsesController>(HorsesController);
  });

  describe('getProfile', () => {
    it('should delegate to service with hrNo', async () => {
      const profile = { hrNo: '12345', hrName: 'TestHorse', totalRaces: 10 };
      mockService.getProfile.mockResolvedValue(profile);

      const response = await controller.getProfile('12345');

      expect(response).toEqual(profile);
      expect(mockService.getProfile).toHaveBeenCalledWith('12345');
    });
  });

  describe('getHistory', () => {
    it('should delegate to service with parsed page and limit', async () => {
      const history = { data: [], total: 0 };
      mockService.getHistory.mockResolvedValue(history);

      const response = await controller.getHistory('12345', '2', '15');

      expect(response).toEqual(history);
      expect(mockService.getHistory).toHaveBeenCalledWith('12345', 2, 15);
    });

    it('should default page to 1 and limit to 20', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('12345');

      expect(mockService.getHistory).toHaveBeenCalledWith('12345', 1, 20);
    });

    it('should clamp limit to max 50', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('12345', '1', '100');

      expect(mockService.getHistory).toHaveBeenCalledWith('12345', 1, 50);
    });

    it('should clamp page to min 1', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('12345', '0', '10');

      expect(mockService.getHistory).toHaveBeenCalledWith('12345', 1, 10);
    });
  });
});
