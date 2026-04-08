import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import helmet from 'helmet';
import * as express from 'express';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.APP_ENV ?? 'local',
    tracesSampleRate: 0.1,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Security headers
  app.use(helmet());

  // Request body size limit — prevent large payload attacks
  app.use(express.json({ limit: '500kb' }));
  app.use(express.urlencoded({ extended: true, limit: '500kb' }));

  // Global API Prefix — 모바일 앱의 baseURL이 /api를 사용
  // health는 nginx/LB 헬스체크용으로 /health에 노출 (prefix 제외)
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/detailed', method: RequestMethod.GET },
    ],
  });

  // CORS — environment-aware origin whitelist
  const env = process.env.NODE_ENV ?? 'development';

  // Static production origins (exact match)
  const PRODUCTION_ORIGINS = [
    // Custom domains
    'https://oddscast.bet',
    'https://www.oddscast.bet',
    'https://server.oddscast.bet',
    'https://admin.oddscast.bet',
    'https://www.admin.oddscast.bet',
    // Railway
    'https://oddscast.up.railway.app',
    'https://oddscast-admin.up.railway.app',
    'https://server-production-aee6.up.railway.app',
    'https://webapp-production-75e0.up.railway.app',
    'https://admin-production-8e90.up.railway.app',
    // Vercel
    'https://oddscast-webapp.vercel.app',
    'https://oddscast-admin.vercel.app',
  ];

  // Dynamic origins via env var (comma-separated)
  const additionalOrigins = process.env.CORS_ADDITIONAL_ORIGINS
    ? process.env.CORS_ADDITIONAL_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  // Mobile WebView origins
  const mobileOrigins = ['file://', 'capacitor://localhost'];

  // Vercel preview deployments follow pattern: *-<team>.vercel.app
  const VERCEL_PREVIEW_RE = /^https:\/\/oddscast-[\w-]+\.vercel\.app$/;
  // Railway preview deployments follow pattern: *-production-*.up.railway.app
  const RAILWAY_PREVIEW_RE = /^https:\/\/[\w-]+-production-[\w]+\.up\.railway\.app$/;

  const allStaticOrigins = new Set([
    ...PRODUCTION_ORIGINS,
    ...additionalOrigins,
    ...mobileOrigins,
  ]);

  const corsOriginHandler = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (server-to-server, curl, mobile)
    if (!origin) return callback(null, true);
    if (allStaticOrigins.has(origin)) return callback(null, true);
    // Allow Vercel/Railway preview deployments
    if (VERCEL_PREVIEW_RE.test(origin) || RAILWAY_PREVIEW_RE.test(origin)) {
      return callback(null, true);
    }
    // Reject silently — throwing causes 500 + Discord noise from bot scans
    callback(null, false);
  };

  app.enableCors({
    origin: env === 'development' ? true : corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger — disabled in production
  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('OddsCast API')
      .setDescription('AI 경마 승부예측 서비스 API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🏇 OddsCast server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();
