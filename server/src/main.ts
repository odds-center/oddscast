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
  const CORS_ORIGINS_BY_ENV: Record<string, string[] | true> = {
    production: [
      'https://oddscast.up.railway.app',
      'https://oddscast-webapp.vercel.app',
      'https://oddscast-admin.vercel.app',
    ],
    development: [
      'http://localhost:3000', // webapp
      'http://localhost:3002', // admin
      'http://10.0.2.2:3000', // Android emulator → host webapp
    ],
  };
  // Additional origins via CORS_ADDITIONAL_ORIGINS env var (comma-separated)
  // Used to add Railway webapp/admin URLs without code changes
  const additionalOrigins = process.env.CORS_ADDITIONAL_ORIGINS
    ? process.env.CORS_ADDITIONAL_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  // Mobile WebView: file:// and capacitor:// origins
  const mobileOrigins = ['file://', 'capacitor://localhost'];
  const envOrigins = CORS_ORIGINS_BY_ENV[env];
  const allowedOrigins =
    envOrigins === true
      ? true
      : [...(envOrigins ?? []), ...additionalOrigins, ...mobileOrigins];

  app.enableCors({
    origin: env === 'development' ? true : allowedOrigins,
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
