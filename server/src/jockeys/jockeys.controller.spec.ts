import { Test, TestingModule } from '@nestjs/testing';
import { JockeysController } from './jockeys.controller';
import { JockeysService } from './jockeys.service';

const mockService = {
  getProfile: jest.fn(),
  getHistory: jest.fn(),
};

describe('JockeysController', () => {
  let controller: JockeysController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JockeysController],
      providers: [{ provide: JockeysService, useValue: mockService }],
    }).compile();

    controller = module.get<JockeysController>(JockeysController);
  });

  describe('getProfile', () => {
    it('should delegate to service with jkNo', async () => {
      const profile = { jkNo: 'J001', jkName: 'TestJockey', wins: 50 };
      mockService.getProfile.mockResolvedValue(profile);

      const response = await controller.getProfile('J001');

      expect(response).toEqual(profile);
      expect(mockService.getProfile).toHaveBeenCalledWith('J001');
    });
  });

  describe('getHistory', () => {
    it('should delegate to service with parsed page and limit', async () => {
      const history = { data: [], total: 0 };
      mockService.getHistory.mockResolvedValue(history);

      const response = await controller.getHistory('J001', '3', '25');

      expect(response).toEqual(history);
      expect(mockService.getHistory).toHaveBeenCalledWith('J001', 3, 25);
    });

    it('should default page to 1 and limit to 20', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('J001');

      expect(mockService.getHistory).toHaveBeenCalledWith('J001', 1, 20);
    });

    it('should clamp limit to max 50', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('J001', '1', '999');

      expect(mockService.getHistory).toHaveBeenCalledWith('J001', 1, 50);
    });

    it('should clamp page to min 1', async () => {
      mockService.getHistory.mockResolvedValue({ data: [], total: 0 });

      await controller.getHistory('J001', '-5', '10');

      expect(mockService.getHistory).toHaveBeenCalledWith('J001', 1, 10);
    });
  });
});
