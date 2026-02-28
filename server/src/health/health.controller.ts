import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/** nginx / 로드밸런서용 헬스체크 — rate limit 제외 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'OddsCast API',
      version: '1.0.0',
    };
  }

  @Get('detailed')
  detailed() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'OddsCast API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}
