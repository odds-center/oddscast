import compression from 'compression';
import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './api/routes';
import {
  CURRENT_CONFIG,
  getEnvironmentInfo,
  isDevelopment,
  isLocal,
} from './constants/environment';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env['PORT'] || 3000;

// 환경 정보 로깅
logger.info('서버 시작', getEnvironmentInfo());

// 보안 미들웨어
app.use(
  helmet({
    contentSecurityPolicy: isDevelopment()
      ? false
      : {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
  })
);

// CORS 설정 - 환경별로 동적 설정
app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // 개발 환경에서는 origin이 없는 요청도 허용 (Postman, curl 등)
      if ((isDevelopment() || isLocal()) && !origin) {
        return callback(null, true);
      }

      // 허용된 origin인지 확인
      if (origin && CURRENT_CONFIG.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 개발 환경에서는 localhost 관련 origin들을 추가로 허용
      if (
        (isDevelopment() || isLocal()) &&
        origin &&
        (origin.startsWith('http://localhost:') ||
          origin.startsWith('exp://localhost:'))
      ) {
        return callback(null, true);
      }

      logger.warn('CORS 차단된 origin', {
        origin,
        allowedOrigins: CURRENT_CONFIG.corsOrigins,
      });
      return callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 압축 미들웨어 - 환경별 설정
if (CURRENT_CONFIG.enableCompression) {
  app.use(compression());
}

// 요청 제한 - 환경별 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: CURRENT_CONFIG.rateLimitMaxRequests,
  message: {
    success: false,
    error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 로깅 미들웨어
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

// JSON 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API 라우트
app.use('/api', apiRoutes);

// 루트 엔드포인트
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Golden Race API 서버가 정상적으로 작동 중입니다.',
    version: process.env['npm_package_version'] || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: getEnvironmentInfo().environment,
    endpoints: {
      health: '/api/health',
      races: '/api/races',
      results: '/api/results',
      racePlans: '/api/race-plans',
      documentation: '/api/docs',
    },
  });
});

// 404 핸들러
app.use('*', (req: Request, res: Response) => {
  logger.warn('404 Not Found', { method: req.method, url: req.originalUrl });
  res.status(404).json({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl,
  });
});

// 전역 에러 핸들러
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.',
    message: isDevelopment() ? error.message : 'Internal Server Error',
  });
});

// 서버 시작
app.listen(PORT, () => {
  logger.info(`🚀 Golden Race Server가 포트 ${PORT}에서 시작되었습니다.`, {
    environment: getEnvironmentInfo().environment,
    corsOrigins: CURRENT_CONFIG.corsOrigins,
    rateLimitMaxRequests: CURRENT_CONFIG.rateLimitMaxRequests,
    enableCompression: CURRENT_CONFIG.enableCompression,
    enableMetrics: CURRENT_CONFIG.enableMetrics,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT 신호를 받았습니다. 서버를 종료합니다.');
  process.exit(0);
});
