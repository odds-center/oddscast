import { Controller, Get, InternalServerErrorException, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/** nginx / 로드밸런서용 헬스체크 — rate limit 제외 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /** TEMPORARY: one-time admin password reset — REMOVE AFTER USE */
  @Get('reset-admin-pw')
  async resetAdminPw(@Query('key') key: string) {
    if (key !== 'oddscast-temp-reset-2026') return { status: 'forbidden' };
    const hashed = await bcrypt.hash('admin1234', 10);
    const result = await this.dataSource.query(
      `UPDATE oddscast.admin_users SET password = $1 WHERE id = (SELECT id FROM oddscast.admin_users LIMIT 1) RETURNING "loginId"`,
      [hashed],
    );
    return { status: 'ok', updated: result };
  }

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'OddsCast API',
      version: '1.0.0',
    };
  }

  /** Dev-only: trigger a 500 error to test Sentry + file logging */
  @Get('test-error')
  testError() {
    if (process.env.NODE_ENV === 'production') {
      return { status: 'disabled in production' };
    }
    throw new InternalServerErrorException('Test error: Sentry + Winston logging check');
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
