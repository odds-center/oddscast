import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { KraApiService } from './kra-api.service';

@ApiTags('kra-api')
@Controller('kra-api')
export class KraApiController {
  constructor(private readonly kraApiService: KraApiService) {}

  @Get('status')
  @ApiOperation({ summary: 'KRA API 상태 확인' })
  @ApiResponse({ status: 200, description: 'API 상태 정보' })
  async getApiStatus() {
    return this.kraApiService.checkApiStatus();
  }

  @Get('race-records')
  @ApiOperation({ summary: '경주기록 정보 조회 (API4_3)' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1: 서울, 2: 부산경남, 3: 제주)',
  })
  @ApiQuery({ name: 'rcNo', required: false, description: '경주번호' })
  @ApiResponse({ status: 200, description: '경주기록 정보' })
  async getRaceRecords(
    @Query('date') date?: string,
    @Query('meet') meet?: string,
    @Query('rcNo') rcNo?: string
  ) {
    return this.kraApiService.getRaceRecords(date, meet, rcNo);
  }

  @Get('dividend-rates')
  @ApiOperation({ summary: '확정배당율 통합 정보 조회 (API160)' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1: 서울, 2: 부산경남, 3: 제주)',
  })
  @ApiResponse({ status: 200, description: '확정배당율 정보' })
  async getDividendRates(
    @Query('date') date?: string,
    @Query('meet') meet?: string
  ) {
    return this.kraApiService.getDividendRates(date, meet);
  }

  @Get('entry-details')
  @ApiOperation({ summary: '출전표 상세정보 조회 (API26_2)' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1: 서울, 2: 부산경남, 3: 제주)',
  })
  @ApiResponse({ status: 200, description: '출전표 상세정보' })
  async getEntryDetails(
    @Query('date') date?: string,
    @Query('meet') meet?: string
  ) {
    return this.kraApiService.getEntryDetails(date, meet);
  }

  @Get('race-plans')
  @ApiOperation({ summary: '경주계획표 정보 조회 (API72_2)' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: '경주계획표 정보' })
  async getRacePlans(@Query('date') date?: string) {
    return this.kraApiService.getRacePlans(date);
  }

  // 기존 메서드들 (하위 호환성 유지)
  @Get('races')
  @ApiOperation({ summary: '경마 일정 데이터 (기존)' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: '경마 일정 데이터' })
  async getRaces(@Query('date') date?: string) {
    // 기존 getRaces 메서드 대신 getRaceRecords 사용
    return this.kraApiService.getRaceRecords(date);
  }

  @Get('results')
  @ApiOperation({ summary: '경마 결과 데이터 (기존)' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: '경마 결과 데이터' })
  async getResults(@Query('date') date?: string) {
    // 기존 getResults 메서드 대신 getRaceRecords 사용
    return this.kraApiService.getRaceRecords(date);
  }
}
