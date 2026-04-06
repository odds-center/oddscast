import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

const mockAnalysisService = {
  analyzeJockey: jest.fn(),
};

describe('AnalysisController', () => {
  let controller: AnalysisController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [{ provide: AnalysisService, useValue: mockAnalysisService }],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
  });

  describe('getJockeyAnalysis', () => {
    it('should return jockey analysis for a race', async () => {
      const analysis = {
        raceId: 1,
        entries: [
          { hrNo: '1', jkNo: '101', jockeyScore: 85 },
          { hrNo: '2', jkNo: '102', jockeyScore: 72 },
        ],
      };
      mockAnalysisService.analyzeJockey.mockResolvedValue(analysis);

      const result = await controller.getJockeyAnalysis(1);

      expect(mockAnalysisService.analyzeJockey).toHaveBeenCalledWith(1);
      expect(result).toBe(analysis);
    });

    it('should propagate errors from service', async () => {
      mockAnalysisService.analyzeJockey.mockRejectedValue(
        new Error('Race not found'),
      );

      await expect(controller.getJockeyAnalysis(999)).rejects.toThrow(
        'Race not found',
      );
    });
  });
});
