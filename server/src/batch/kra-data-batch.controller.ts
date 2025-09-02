import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KraDataSchedulerService } from './kra-data-scheduler.service';

@ApiTags('KRA 데이터 배치')
@Controller('batch/kra-data')
// @UseGuards(JwtAuthGuard) // 임시로 인증 제거
// @ApiBearerAuth()
export class KraDataBatchController {
  constructor(
    private readonly kraDataSchedulerService: KraDataSchedulerService
  ) {}

  @Post('collect-historical')
  @ApiOperation({
    summary: '과거 1년치 데이터 수집',
    description: '과거 1년간의 KRA 데이터를 수집하여 DB에 저장합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '과거 데이터 수집 시작',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '과거 1년치 데이터 수집이 시작되었습니다.',
        },
        estimatedTime: { type: 'string', example: '약 6-8시간 소요 예상' },
      },
    },
  })
  async collectHistoricalData() {
    // 백그라운드에서 실행
    this.kraDataSchedulerService.collectHistoricalData();

    return {
      message: '과거 1년치 데이터 수집이 시작되었습니다.',
      estimatedTime: '약 6-8시간 소요 예상',
      note: '진행 상황은 서버 로그를 확인해주세요.',
    };
  }

  @Post('collect-period')
  @ApiOperation({
    summary: '특정 기간 데이터 수집',
    description: '지정된 기간의 KRA 데이터를 수집하여 DB에 저장합니다.',
  })
  @ApiQuery({
    name: 'startDate',
    description: '시작 날짜 (YYYYMMDD 형식)',
    example: '20240101',
  })
  @ApiQuery({
    name: 'endDate',
    description: '종료 날짜 (YYYYMMDD 형식)',
    example: '20240131',
  })
  @ApiResponse({
    status: 200,
    description: '기간 데이터 수집 시작',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '20240101 ~ 20240131 기간 데이터 수집이 시작되었습니다.',
        },
        period: { type: 'string', example: '31일' },
        estimatedTime: { type: 'string', example: '약 1-2시간 소요 예상' },
      },
    },
  })
  async collectDataForPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    // 백그라운드에서 실행
    this.kraDataSchedulerService.collectDataForPeriod(startDate, endDate);

    return {
      message: `${startDate} ~ ${endDate} 기간 데이터 수집이 시작되었습니다.`,
      period: `${startDate} ~ ${endDate}`,
      estimatedTime: '기간에 따라 1-8시간 소요 예상',
      note: '진행 상황은 서버 로그를 확인해주세요.',
    };
  }

  @Post('collect-daily-results')
  @ApiOperation({
    summary: '일일 경주 결과 수집',
    description: '전날의 경주 결과 데이터를 수집합니다.',
  })
  @ApiQuery({
    name: 'date',
    description: '수집할 날짜 (YYYYMMDD 형식, 미입력 시 전날)',
    required: false,
    example: '20240101',
  })
  @ApiResponse({
    status: 200,
    description: '일일 경주 결과 수집 완료',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '20240101 경주 결과 수집이 완료되었습니다.',
        },
        date: { type: 'string', example: '20240101' },
      },
    },
  })
  async collectDailyResults(@Query('date') date?: string) {
    const targetDate =
      date ||
      new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

    await this.kraDataSchedulerService.collectRaceResultsForDate(targetDate);

    return {
      message: `${targetDate} 경주 결과 수집이 완료되었습니다.`,
      date: targetDate,
    };
  }

  @Post('collect-daily-plans')
  @ApiOperation({
    summary: '일일 경주 계획 수집',
    description: '오늘의 경주 계획 데이터를 수집합니다.',
  })
  @ApiQuery({
    name: 'date',
    description: '수집할 날짜 (YYYYMMDD 형식, 미입력 시 오늘)',
    required: false,
    example: '20240101',
  })
  @ApiResponse({
    status: 200,
    description: '일일 경주 계획 수집 완료',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '20240101 경주 계획 수집이 완료되었습니다.',
        },
        date: { type: 'string', example: '20240101' },
      },
    },
  })
  async collectDailyPlans(@Query('date') date?: string) {
    const targetDate =
      date || new Date().toISOString().slice(0, 10).replace(/-/g, '');

    await this.kraDataSchedulerService.collectRacePlansForDate(targetDate);

    return {
      message: `${targetDate} 경주 계획 수집이 완료되었습니다.`,
      date: targetDate,
    };
  }

  @Post('collect-daily-dividends')
  @ApiOperation({
    summary: '일일 확정 배당율 수집',
    description: '오늘의 확정 배당율 데이터를 수집합니다.',
  })
  @ApiQuery({
    name: 'date',
    description: '수집할 날짜 (YYYYMMDD 형식, 미입력 시 오늘)',
    required: false,
    example: '20240101',
  })
  @ApiResponse({
    status: 200,
    description: '일일 확정 배당율 수집 완료',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '20240101 확정 배당율 수집이 완료되었습니다.',
        },
        date: { type: 'string', example: '20240101' },
      },
    },
  })
  async collectDailyDividends(@Query('date') date?: string) {
    const targetDate =
      date || new Date().toISOString().slice(0, 10).replace(/-/g, '');

    await this.kraDataSchedulerService.collectDividendRatesForDate(targetDate);

    return {
      message: `${targetDate} 확정 배당율 수집이 완료되었습니다.`,
      date: targetDate,
    };
  }

  @Post('cleanup-old-data')
  @ApiOperation({
    summary: '오래된 데이터 정리',
    description: '30일 이전의 데이터를 정리합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '오래된 데이터 정리 완료',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '오래된 데이터 정리가 완료되었습니다.',
        },
        cutoffDate: { type: 'string', example: '20231201' },
      },
    },
  })
  async cleanupOldData() {
    await this.kraDataSchedulerService.cleanupOldData();

    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    return {
      message: '오래된 데이터 정리가 완료되었습니다.',
      cutoffDate,
    };
  }

  @Get('status')
  @ApiOperation({
    summary: '배치 작업 상태 확인',
    description: '현재 배치 작업의 상태를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '배치 작업 상태',
    schema: {
      type: 'object',
      properties: {
        schedulerEnabled: { type: 'boolean', example: true },
        lastRun: { type: 'string', example: '2024-01-01T06:00:00Z' },
        nextRun: { type: 'string', example: '2024-01-02T06:00:00Z' },
        schedule: {
          type: 'object',
          properties: {
            raceResults: { type: 'string', example: '매일 오전 6시' },
            racePlans: { type: 'string', example: '매일 오전 7시' },
            dividendRates: { type: 'string', example: '매일 오후 2시' },
            cleanup: { type: 'string', example: '매주 일요일' },
          },
        },
      },
    },
  })
  async getBatchStatus() {
    return {
      schedulerEnabled: true,
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      schedule: {
        raceResults: '매일 오전 6시',
        racePlans: '매일 오전 7시',
        dividendRates: '매일 오후 2시',
        cleanup: '매주 일요일',
      },
    };
  }
}
