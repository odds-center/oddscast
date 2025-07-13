import { Router } from 'express';
import healthRouter from './health';
import racesRouter from './races';
import resultsRouter from './results';
import racePlansRouter from './racePlans';

const router = Router();

router.use('/health', healthRouter);
router.use('/races', racesRouter);
router.use('/results', resultsRouter);
router.use('/race-plans', racePlansRouter);

// API 루트 엔드포인트
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Golden Race API 서버가 정상적으로 작동 중입니다.',
    version: process.env['npm_package_version'] || '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      races: '/api/races',
      results: '/api/results',
      racePlans: '/api/race-plans',
      documentation: '/api/docs',
    },
  });
});

export default router;
