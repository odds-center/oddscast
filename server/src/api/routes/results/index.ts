import { Router, Request, Response } from 'express';
import { logger } from '../../../utils/logger';
import { DataSyncService } from '../../../services/dataSyncService';

const router = Router();
const dataSyncService = new DataSyncService();

/**
 * @route   GET /api/results
 * @desc    경마 결과 데이터 조회
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { date, raceId, limit = '50', offset = '0' } = req.query;
    logger.info('Results data requested', {
      date: date as string,
      raceId: raceId as string,
      limit: limit as string,
      offset: offset as string,
      ip: req.ip,
    });
    const results = await dataSyncService.getResults({
      date: date as string,
      raceId: raceId as string,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
    res.status(200).json({
      success: true,
      data: results,
      message: '경마 결과 데이터를 성공적으로 조회했습니다.',
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        count: results.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch results data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    res.status(500).json({
      success: false,
      error: '경마 결과 데이터 조회 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
