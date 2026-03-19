import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyPreviewController } from './weekly-preview.controller';
import { WeeklyPreviewService } from './weekly-preview.service';

const mockWeeklyPreviewService = {
  getByWeek: jest.fn(),
  getLatest: jest.fn(),
};

describe('WeeklyPreviewController', () => {
  let controller: WeeklyPreviewController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeeklyPreviewController],
      providers: [
        {
          provide: WeeklyPreviewService,
          useValue: mockWeeklyPreviewService,
        },
      ],
    }).compile();

    controller = module.get<WeeklyPreviewController>(WeeklyPreviewController);
  });

  describe('get', () => {
    it('should return preview for specific week when week param provided', async () => {
      const preview = { weekLabel: '2025-W10', content: 'Preview content' };
      mockWeeklyPreviewService.getByWeek.mockResolvedValue(preview);

      const result = await controller.get('2025-W10');

      expect(mockWeeklyPreviewService.getByWeek).toHaveBeenCalledWith(
        '2025-W10',
      );
      expect(result).toBe(preview);
    });

    it('should return fallback when specific week not found', async () => {
      mockWeeklyPreviewService.getByWeek.mockResolvedValue(null);

      const result = await controller.get('2025-W99');

      expect(result).toEqual({ weekLabel: null, content: null });
    });

    it('should return latest preview when no week param', async () => {
      const preview = { weekLabel: '2025-W10', content: 'Latest' };
      mockWeeklyPreviewService.getLatest.mockResolvedValue(preview);

      const result = await controller.get(undefined);

      expect(mockWeeklyPreviewService.getLatest).toHaveBeenCalled();
      expect(mockWeeklyPreviewService.getByWeek).not.toHaveBeenCalled();
      expect(result).toBe(preview);
    });

    it('should return fallback when no latest preview exists', async () => {
      mockWeeklyPreviewService.getLatest.mockResolvedValue(null);

      const result = await controller.get(undefined);

      expect(result).toEqual({ weekLabel: null, content: null });
    });

    it('should treat empty/whitespace week param as no week', async () => {
      mockWeeklyPreviewService.getLatest.mockResolvedValue(null);

      const result = await controller.get('   ');

      expect(mockWeeklyPreviewService.getLatest).toHaveBeenCalled();
      expect(mockWeeklyPreviewService.getByWeek).not.toHaveBeenCalled();
      expect(result).toEqual({ weekLabel: null, content: null });
    });
  });
});
