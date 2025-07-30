import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { KraApiService } from '@/services/kraApiService';

const router = Router();
const kraApiService = new KraApiService();

/**
 * @route   GET /api/kra/records
 * @desc    KRA 경주기록 정보 조회
 * @access  Public
 */
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { date, venue, pageNo = '1', numOfRows = '100' } = req.query;
    logger.info('KRA race records requested', {
      date: date as string,
      venue: venue as string,
      pageNo: pageNo as string,
      numOfRows: numOfRows as string,
      ip: req.ip,
    });

    // KRA API에서 경주기록 데이터 가져오기
    const records = await kraApiService.getRaces(date as string);

    res.status(200).json({
      success: true,
      data: records,
      message: 'KRA 경주기록 정보를 성공적으로 조회했습니다.',
      pagination: {
        pageNo: parseInt(pageNo as string, 10),
        numOfRows: parseInt(numOfRows as string, 10),
        count: records.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch KRA race records', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    res.status(500).json({
      success: false,
      error: 'KRA 경주기록 정보 조회 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/kra/plans
 * @desc    KRA 경주계획표 조회
 * @access  Public
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const {
      year,
      month,
      day,
      venue,
      pageNo = '1',
      numOfRows = '100',
    } = req.query;
    logger.info('KRA race plans requested', {
      year: year as string,
      month: month as string,
      day: day as string,
      venue: venue as string,
      pageNo: pageNo as string,
      numOfRows: numOfRows as string,
      ip: req.ip,
    });

    // KRA API에서 경주계획표 데이터 가져오기
    const plans = await kraApiService.getRacePlans(
      year && month && day ? `${year}${month}${day}` : undefined
    );

    res.status(200).json({
      success: true,
      data: plans,
      message: 'KRA 경주계획표를 성공적으로 조회했습니다.',
      pagination: {
        pageNo: parseInt(pageNo as string, 10),
        numOfRows: parseInt(numOfRows as string, 10),
        count: plans.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch KRA race plans', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    res.status(500).json({
      success: false,
      error: 'KRA 경주계획표 조회 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/kra/health
 * @desc    KRA API 상태 확인
 * @access  Public
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const status = await kraApiService.checkApiStatus();

    res.status(200).json({
      success: true,
      data: status,
      message: 'KRA API 상태를 성공적으로 확인했습니다.',
    });
  } catch (error) {
    logger.error('Failed to check KRA API health', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'KRA API 상태 확인 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
