import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '기본 헬스체크' })
  @ApiResponse({ status: 200, description: '서버 상태 확인' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Golden Race API',
      version: '1.0.0',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: '상세 헬스체크' })
  @ApiResponse({ status: 200, description: '상세 서버 상태 정보' })
  detailedCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Golden Race API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}
