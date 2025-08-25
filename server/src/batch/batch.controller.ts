import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BatchService } from './batch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('배치 작업')
@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '수동 데이터 동기화 실행' })
  @ApiQuery({
    name: 'date',
    description: '동기화할 날짜 (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @ApiResponse({ status: 200, description: '데이터 동기화 성공' })
  @ApiResponse({ status: 400, description: '잘못된 날짜 형식' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async manualSync(@Query('date') date: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        success: false,
        message: '올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)',
      };
    }

    return await this.batchService.manualSync(date);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '데이터 동기화 상태 확인' })
  @ApiResponse({ status: 200, description: '동기화 상태 정보' })
  async getSyncStatus() {
    return await this.batchService.getSyncStatus();
  }

  @Post('sync-today')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '오늘 날짜 데이터 동기화 실행' })
  @ApiResponse({ status: 200, description: '데이터 동기화 성공' })
  async syncToday() {
    const today = new Date().toISOString().split('T')[0];
    return await this.batchService.manualSync(today);
  }

  @Post('sync-yesterday')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '어제 날짜 데이터 동기화 실행' })
  @ApiResponse({ status: 200, description: '데이터 동기화 성공' })
  async syncYesterday() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    return await this.batchService.manualSync(yesterday);
  }
}
