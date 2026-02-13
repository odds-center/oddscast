import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { logger } from './utils/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // 글로벌 프리픽스 설정
  app.setGlobalPrefix('api');

  // CORS 설정
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'exp://localhost:19000',
          ],
    credentials: true,
  });

  // 글로벌 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Golden Race API')
    .setDescription('한국마사회 API 통합 서버')
    .setVersion('1.0')
    .addTag('races', '경마 관련 API')
    .addTag('results', '경마 결과 API')
    .addTag('race-plans', '경주계획표 API')
    .addTag('health', '헬스체크 API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.info(`🚀 Golden Race 서버가 포트 ${port}에서 실행 중입니다.`);
  logger.info(`📚 API 문서: http://localhost:${port}/api/docs`);
}

bootstrap().catch(error => {
  logger.error('서버 시작 실패:', error);
  process.exit(1);
});
