import { Router, Request, Response } from 'express';
import { logger } from '../../../utils/logger';

const router = Router();

// ... 이하 기존 healthRoutes.ts 전체 코드 복사 ...

/**
 * @route   GET /api/health
 * @desc    서버 상태 확인
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    };

    logger.info('Health check requested', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      data: healthCheck,
      message: '서버가 정상적으로 작동 중입니다.',
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: '서버 상태 확인 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/health/detailed
 * @desc    상세 서버 상태 확인
 * @access  Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const detailedHealthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
      env: {
        NODE_ENV: process.env['NODE_ENV'],
        PORT: process.env['PORT'],
        SUPABASE_URL: process.env['SUPABASE_URL'] ? '***' : undefined,
        SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'] ? '***' : undefined,
        KRA_API_KEY: process.env['KRA_API_KEY'] ? '***' : undefined,
      },
    };

    logger.info('Detailed health check requested', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      data: detailedHealthCheck,
      message: '상세 서버 상태 정보입니다.',
    });
  } catch (error) {
    logger.error('Detailed health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: '상세 서버 상태 확인 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/health/ready
 * @desc    서버 준비 상태 확인 (배포 시 사용)
 * @access  Public
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // 서버가 요청을 처리할 준비가 되었는지 확인
    const isReady = process.uptime() > 5; // 최소 5초 후에 준비 완료로 간주

    if (!isReady) {
      logger.warn('Server not ready yet', { uptime: process.uptime() });
      return res.status(503).json({
        success: false,
        status: 'NOT_READY',
        message: '서버가 아직 준비되지 않았습니다.',
        uptime: process.uptime(),
      });
    }

    logger.info('Readiness check passed', { uptime: process.uptime() });

    return res.status(200).json({
      success: true,
      status: 'READY',
      message: '서버가 요청을 처리할 준비가 되었습니다.',
      uptime: process.uptime(),
    });
  } catch (error) {
    logger.error('Readiness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      error: '서버 준비 상태 확인 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/health/live
 * @desc    서버 생존 상태 확인 (로드밸런서용)
 * @access  Public
 */
router.get('/live', async (_req: Request, res: Response) => {
  try {
    // 간단한 생존 확인
    return res.status(200).json({
      success: true,
      status: 'ALIVE',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Liveness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      status: 'DEAD',
      error: '서버 생존 상태 확인 중 오류가 발생했습니다.',
    });
  }
});

export default router;
