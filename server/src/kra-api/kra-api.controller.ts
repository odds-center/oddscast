/**
 * KRA API 컨트롤러
 * 한국마사회 API 엔드포인트를 제공합니다.
 */

import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { KraApiIntegratedService } from './kra-api-integrated.service';
import { getCurrentDate } from './utils/kra.utils';

@ApiTags('KRA API')
@Controller('kra-api')
export class KraApiController {
  private readonly logger = new Logger(KraApiController.name);

  constructor(private readonly kraApiService: KraApiIntegratedService) {}

  // ============================================
  // 시스템 상태
  // ============================================

  @Get('status')
  @ApiOperation({ summary: 'KRA API 상태 확인' })
  @ApiResponse({ status: 200, description: 'API 상태 정보' })
  async getApiStatus() {
    try {
      return await this.kraApiService.checkApiStatus();
    } catch (error) {
      this.logger.error(`Failed to check API status: ${error.message}`);
      throw new HttpException(
        'API 상태 확인 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ============================================
  // 경주 계획 엔드포인트
  // ============================================

  @Get('race-plans')
  @ApiOperation({ summary: '경주 계획표 조회' })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일 (YYYYMMDD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1:서울, 2:부산경남, 3:제주)',
  })
  @ApiQuery({ name: 'rcNo', required: false, description: '경주번호' })
  @ApiResponse({ status: 200, description: '경주 계획표 목록' })
  async getRacePlans(
    @Query('rcDate') rcDate?: string,
    @Query('meet') meet?: string,
    @Query('rcNo') rcNo?: string
  ) {
    try {
      return await this.kraApiService.getRacePlans({
        rcDate: rcDate || getCurrentDate(),
        meet,
        rcNo,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch race plans: ${error.message}`);
      throw new HttpException(
        '경주 계획표 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('race-schedule')
  @ApiOperation({ summary: '경주 일정 조회 (경마장별 그룹화)' })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일 (YYYYMMDD)',
  })
  @ApiResponse({ status: 200, description: '경주 일정 정보' })
  async getRaceSchedule(@Query('rcDate') rcDate?: string) {
    try {
      return await this.kraApiService.getRaceSchedule(
        rcDate || getCurrentDate()
      );
    } catch (error) {
      this.logger.error(`Failed to fetch race schedule: ${error.message}`);
      throw new HttpException(
        '경주 일정 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('upcoming-races')
  @ApiOperation({ summary: '향후 경주 일정 조회' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: '조회 일수 (기본 7일)',
  })
  @ApiResponse({ status: 200, description: '향후 경주 일정 목록' })
  async getUpcomingRaces(@Query('days') days?: number) {
    try {
      return await this.kraApiService.getUpcomingRacePlans(days);
    } catch (error) {
      this.logger.error(`Failed to fetch upcoming races: ${error.message}`);
      throw new HttpException(
        '향후 경주 일정 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ============================================
  // 출전표 엔드포인트
  // ============================================

  @Get('entry-sheet')
  @ApiOperation({ summary: '출전표 조회' })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일 (YYYYMMDD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1:서울, 2:부산경남, 3:제주)',
  })
  @ApiQuery({ name: 'rcNo', required: false, description: '경주번호' })
  @ApiResponse({ status: 200, description: '출전표 목록' })
  async getEntrySheet(
    @Query('rcDate') rcDate?: string,
    @Query('meet') meet?: string,
    @Query('rcNo') rcNo?: string
  ) {
    try {
      return await this.kraApiService.getEntrySheet({
        rcDate: rcDate || getCurrentDate(),
        meet,
        rcNo,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch entry sheet: ${error.message}`);
      throw new HttpException(
        '출전표 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('horse-entries/:hrNo')
  @ApiOperation({ summary: '특정 말의 출전 정보 조회' })
  @ApiParam({ name: 'hrNo', description: '마번' })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일 (YYYYMMDD)',
  })
  @ApiResponse({ status: 200, description: '말 출전 정보' })
  async getHorseEntries(
    @Param('hrNo') hrNo: string,
    @Query('rcDate') rcDate?: string
  ) {
    try {
      return await this.kraApiService.getHorseEntries(hrNo, rcDate);
    } catch (error) {
      this.logger.error(`Failed to fetch horse entries: ${error.message}`);
      throw new HttpException(
        '말 출전 정보 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ============================================
  // 경주 기록 엔드포인트
  // ============================================

  @Get('race-records')
  @ApiOperation({ summary: '경주 기록 조회' })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일 (YYYYMMDD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1:서울, 2:부산경남, 3:제주)',
  })
  @ApiQuery({ name: 'rcNo', required: false, description: '경주번호' })
  @ApiResponse({ status: 200, description: '경주 기록 목록' })
  async getRaceRecords(
    @Query('rcDate') rcDate?: string,
    @Query('meet') meet?: string,
    @Query('rcNo') rcNo?: string
  ) {
    try {
      return await this.kraApiService.getRaceRecords({
        rcDate: rcDate || getCurrentDate(),
        meet,
        rcNo,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch race records: ${error.message}`);
      throw new HttpException(
        '경주 기록 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ============================================
  // 확정 배당율 엔드포인트
  // ============================================

  @Get('dividend-rates')
  @ApiOperation({ summary: '확정 배당율 조회' })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일 (YYYYMMDD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1:서울, 2:부산경남, 3:제주)',
  })
  @ApiQuery({ name: 'rcNo', required: false, description: '경주번호' })
  @ApiQuery({
    name: 'winType',
    required: false,
    description: '승식구분 (WIN,PLC,QNL,EXA,QPL,TLA,TRI)',
  })
  @ApiResponse({ status: 200, description: '확정 배당율 목록' })
  async getDividendRates(
    @Query('rcDate') rcDate?: string,
    @Query('meet') meet?: string,
    @Query('rcNo') rcNo?: string,
    @Query('winType') winType?: string
  ) {
    try {
      return await this.kraApiService.getDividendRates({
        rcDate: rcDate || getCurrentDate(),
        meet,
        rcNo,
        winType,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch dividend rates: ${error.message}`);
      throw new HttpException(
        '확정 배당율 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dividend-rates/grouped')
  @ApiOperation({ summary: '경주별 배당율 그룹화 조회' })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일 (YYYYMMDD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1:서울, 2:부산경남, 3:제주)',
  })
  @ApiResponse({ status: 200, description: '경주별 배당율 그룹' })
  async getGroupedDividends(
    @Query('rcDate') rcDate?: string,
    @Query('meet') meet?: string
  ) {
    try {
      return await this.kraApiService.getGroupedDividends(
        rcDate || getCurrentDate(),
        meet
      );
    } catch (error) {
      this.logger.error(`Failed to fetch grouped dividends: ${error.message}`);
      throw new HttpException(
        '배당율 그룹 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ============================================
  // 통합 엔드포인트
  // ============================================

  @Get('race/:meet/:rcDate/:rcNo')
  @ApiOperation({ summary: '특정 경주의 완전한 정보 조회' })
  @ApiParam({
    name: 'meet',
    description: '경마장 (1:서울, 2:부산경남, 3:제주)',
  })
  @ApiParam({ name: 'rcDate', description: '경주일 (YYYYMMDD)' })
  @ApiParam({ name: 'rcNo', description: '경주번호' })
  @ApiResponse({ status: 200, description: '경주 완전 정보' })
  async getCompleteRaceInfo(
    @Param('meet') meet: string,
    @Param('rcDate') rcDate: string,
    @Param('rcNo') rcNo: string
  ) {
    try {
      return await this.kraApiService.getCompleteRaceInfo(rcDate, meet, rcNo);
    } catch (error) {
      this.logger.error(`Failed to fetch complete race info: ${error.message}`);
      throw new HttpException(
        '경주 정보 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('daily-races')
  @ApiOperation({ summary: '일일 모든 경주 정보 조회 (통합)' })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일 (YYYYMMDD)',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '경마장 (1:서울, 2:부산경남, 3:제주)',
  })
  @ApiResponse({ status: 200, description: '일일 경주 완전 정보 목록' })
  async getDailyCompleteRaceInfo(
    @Query('rcDate') rcDate?: string,
    @Query('meet') meet?: string
  ) {
    try {
      return await this.kraApiService.getDailyCompleteRaceInfo(
        rcDate || getCurrentDate(),
        meet
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch daily complete race info: ${error.message}`
      );
      throw new HttpException(
        '일일 경주 정보 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
