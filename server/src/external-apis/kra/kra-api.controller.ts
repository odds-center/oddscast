import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { KraApiService } from './kra-api.service';

@ApiTags('KRA API')
@Controller('kra-api')
export class KraApiController {
  constructor(private readonly kraApiService: KraApiService) {}

  @Get('race-records')
  @ApiOperation({
    summary: '경주기록 조회 (API4_3)',
    description: '한국마사회 경주 결과 및 기록 정보를 조회합니다.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD 형식)',
    example: '2024-12-01',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'rcNo',
    required: false,
    description: '경주번호 (1-12)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: '경주기록 정보 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meet: {
                type: 'string',
                description: '시행경마장구분',
                example: '1',
              },
              meet_name: {
                type: 'string',
                description: '시행경마장명',
                example: '서울',
              },
              rc_date: {
                type: 'string',
                description: '경주일자',
                example: '20241201',
              },
              rc_no: { type: 'string', description: '경주번호', example: '1' },
              rc_name: {
                type: 'string',
                description: '경주명',
                example: '3세이상일반',
              },
              rc_dist: {
                type: 'string',
                description: '경주거리',
                example: '1600',
              },
              rc_grade: {
                type: 'string',
                description: '등급조건',
                example: 'GENERAL',
              },
              rc_prize: {
                type: 'string',
                description: '1착상금',
                example: '50000000',
              },
              hr_no: { type: 'string', description: '출주번호', example: '3' },
              hr_name: {
                type: 'string',
                description: '마명',
                example: '빅스타',
              },
              jk_name: {
                type: 'string',
                description: '기수명',
                example: '박상원',
              },
              ord: { type: 'string', description: '순위', example: '1' },
              rc_time: {
                type: 'string',
                description: '경주기록',
                example: '1:38.5',
              },
            },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            pageNo: { type: 'number', example: 1 },
            numOfRows: { type: 'number', example: 100 },
            totalCount: { type: 'number', example: 1250 },
            totalPages: { type: 'number', example: 13 },
            validRecords: { type: 'number', example: 98 },
            invalidRecords: { type: 'number', example: 2 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getRaceRecords(
    @Query('date') date?: string,
    @Query('meet') meet?: string,
    @Query('rcNo') rcNo?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRaceRecords(
      date,
      meet,
      rcNo,
      pageNo,
      numOfRows
    );
  }

  @Get('race-records/meet/:meet')
  @ApiOperation({
    summary: '특정 경마장 경주기록 조회',
    description: '지정된 경마장의 경주기록 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'meet',
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'rcNo',
    required: false,
    description: '경주번호 (1-12)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '경마장별 경주기록 조회 성공' })
  async getRaceRecordsByMeet(
    @Param('meet') meet: string,
    @Query('rcDate') rcDate?: string,
    @Query('rcNo') rcNo?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRaceRecordsByMeet(
      meet,
      rcDate,
      rcNo,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-records/race/:rcNo')
  @ApiOperation({
    summary: '특정 경주 기록 조회',
    description: '지정된 경주의 상세 기록 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'rcNo',
    description: '경주번호 (1-12)',
    example: '1',
  })
  @ApiQuery({
    name: 'rcDate',
    required: true,
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'meet',
    required: true,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiResponse({ status: 200, description: '경주별 기록 조회 성공' })
  async getRaceRecordsByRace(
    @Param('rcNo') rcNo: string,
    @Query('rcDate') rcDate: string,
    @Query('meet') meet: string
  ) {
    return this.kraApiService.getRaceRecordsByRace(rcNo, rcDate, meet);
  }

  @Get('race-records/date/:rcDate')
  @ApiOperation({
    summary: '특정 날짜 경주기록 조회',
    description: '지정된 날짜의 모든 경주기록을 조회합니다.',
  })
  @ApiParam({
    name: 'rcDate',
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '날짜별 경주기록 조회 성공' })
  async getRaceRecordsByDate(
    @Param('rcDate') rcDate: string,
    @Query('meet') meet?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRaceRecordsByDate(
      rcDate,
      meet,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-records/month/:rcMonth')
  @ApiOperation({
    summary: '월별 경주기록 조회',
    description: '지정된 월의 모든 경주기록을 조회합니다.',
  })
  @ApiParam({
    name: 'rcMonth',
    description: '경주월 (YYYYMM 형식)',
    example: '202412',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '월별 경주기록 조회 성공' })
  async getRaceRecordsByMonth(
    @Param('rcMonth') rcMonth: string,
    @Query('meet') meet?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRaceRecordsByMonth(
      rcMonth,
      meet,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-records/latest')
  @ApiOperation({
    summary: '최근 경주기록 조회',
    description: '최근 경주일의 경주기록을 조회합니다 (기본값: 최근 1개월).',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '최근 경주기록 조회 성공' })
  async getLatestRaceRecords(
    @Query('meet') meet?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getLatestRaceRecords(
      meet,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-records/statistics')
  @ApiOperation({
    summary: '경주기록 통계 조회',
    description: '경주기록 데이터의 통계 정보를 생성합니다.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD 형식)',
    example: '2024-12-01',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: '경주기록 통계 조회 성공',
    schema: {
      type: 'object',
      properties: {
        totalRaces: { type: 'number', description: '총 경주 수', example: 12 },
        totalParticipants: {
          type: 'number',
          description: '총 출전마 수',
          example: 144,
        },
        averageDistance: {
          type: 'number',
          description: '평균 경주거리',
          example: 1600,
        },
        totalPrize: {
          type: 'number',
          description: '총 상금',
          example: 600000000,
        },
        meetDistribution: { type: 'object', description: '경마장별 분포' },
        gradeDistribution: { type: 'object', description: '등급별 분포' },
        distanceDistribution: { type: 'object', description: '거리별 분포' },
        weatherDistribution: { type: 'object', description: '날씨별 분포' },
        trackDistribution: { type: 'object', description: '트랙별 분포' },
      },
    },
  })
  async getRaceStatistics(
    @Query('date') date?: string,
    @Query('meet') meet?: string
  ) {
    const records = await this.kraApiService.getRaceRecords(date, meet);

    if (!records.success || !records.data) {
      return records;
    }

    // 통계 정보 생성
    const statistics = await this.kraApiService.getRaceStatistics(records.data);

    return {
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
      responseTime: 0,
    };
  }

  @Get('race-records/summary/:rcNo')
  @ApiOperation({
    summary: '경주 결과 요약 조회',
    description: '특정 경주의 결과 요약 정보를 생성합니다.',
  })
  @ApiParam({
    name: 'rcNo',
    description: '경주번호 (1-12)',
    example: '1',
  })
  @ApiQuery({
    name: 'rcDate',
    required: true,
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'meet',
    required: true,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: '경주 결과 요약 조회 성공',
    schema: {
      type: 'object',
      properties: {
        rcDate: {
          type: 'string',
          description: '경주일자',
          example: '20241201',
        },
        meet: { type: 'string', description: '시행경마장', example: '1' },
        rcNo: { type: 'string', description: '경주번호', example: '1' },
        rcName: {
          type: 'string',
          description: '경주명',
          example: '3세이상일반',
        },
        rcDist: { type: 'number', description: '경주거리', example: 1600 },
        rcGrade: { type: 'string', description: '등급', example: 'GENERAL' },
        totalPrize: {
          type: 'number',
          description: '총 상금',
          example: 50000000,
        },
        participants: { type: 'number', description: '출전마 수', example: 12 },
        weather: { type: 'string', description: '날씨', example: '맑음' },
        track: { type: 'string', description: '트랙', example: '잔디' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number', description: '순위', example: 1 },
              horseNo: {
                type: 'string',
                description: '출주번호',
                example: '3',
              },
              horseName: {
                type: 'string',
                description: '마명',
                example: '빅스타',
              },
              jockeyName: {
                type: 'string',
                description: '기수명',
                example: '박상원',
              },
              finishTime: {
                type: 'string',
                description: '경주기록',
                example: '1:38.5',
              },
              prize: { type: 'number', description: '상금', example: 50000000 },
            },
          },
        },
      },
    },
  })
  async getRaceSummary(
    @Param('rcNo') rcNo: string,
    @Query('rcDate') rcDate: string,
    @Query('meet') meet: string
  ) {
    const records = await this.kraApiService.getRaceRecordsByRace(
      rcNo,
      rcDate,
      meet
    );

    if (!records.success || !records.data) {
      return records;
    }

    // 경주 요약 정보 생성
    const summary = await this.kraApiService.getRaceSummary(records.data);

    if (!summary) {
      return {
        success: false,
        error: {
          code: 'NO_SUMMARY_DATA',
          message: '경주 요약 정보를 생성할 수 없습니다.',
          details: { rcNo, rcDate, meet },
        },
        timestamp: new Date().toISOString(),
        responseTime: 0,
      };
    }

    return {
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
      responseTime: 0,
    };
  }

  @Get('dividend-rates')
  @ApiOperation({
    summary: '확정배당율 통합 정보 조회 (API160_1)',
    description: `
      서울, 부산경남, 제주 경마장에서 시행된 경주의 확정배당율 정보를 조회합니다.
      
      **승식구분:**
      - WIN: 단승식 (1등으로 도착할 말 1두 적중)
      - PLC: 연승식 (1~3등 안에 들어올 말 1두 적중)
      - QPL: 복연승식 (1~3등 안에 들어올 말 2두 순서 무관 적중)
      - QNL: 복승식 (1등과 2등으로 들어올 말 2두 순서 무관 적중)
      - EXA: 쌍승식 (1등과 2등으로 들어올 말 2두 순서대로 적중)
      - TLA: 삼복승식 (1,2,3등으로 들어올 말 3두 순서 무관 적중)
      - TRI: 삼쌍승식 (1,2,3등으로 들어올 말 3두 순서대로 적중)
      
      **주의사항:**
      - 경주월/경주일 미입력 시 최근 경마일 정보 조회
      - ServiceKey는 공공데이터포털에서 발급 필요
      - 페이지네이션 필수 (pageNo, numOfRows)
    `,
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD 형식)',
    example: '2024-12-01',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pool',
    required: false,
    description: '승식구분 (WIN, PLC, QPL, QNL, EXA, TLA, TRI)',
    example: 'WIN',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100, 최대: 1000)',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: '확정배당율 정보 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              odds: {
                type: 'string',
                description: '확정 배당율',
                example: '3.2',
              },
              pool: { type: 'string', description: '승식구분', example: 'WIN' },
              chulNo: {
                type: 'string',
                description: '1착마 출주번호',
                example: '3',
              },
              chulNo2: {
                type: 'string',
                description: '2착마 출주번호',
                example: '7',
              },
              chulNo3: {
                type: 'string',
                description: '3착마 출주번호',
                example: '5',
              },
              rcNo: { type: 'string', description: '경주번호', example: '1' },
              meet: {
                type: 'string',
                description: '시행경마장구분',
                example: '1',
              },
              rcDate: {
                type: 'string',
                description: '경주일',
                example: '20241201',
              },
            },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            pageNo: { type: 'number', example: 1 },
            numOfRows: { type: 'number', example: 100 },
            totalCount: { type: 'number', example: 1250 },
            totalPages: { type: 'number', example: 13 },
          },
        },
        timestamp: { type: 'string', example: '2024-12-01T10:30:00.000Z' },
        responseTime: { type: 'number', example: 150 },
      },
    },
  })
  @ApiResponse({
    status: 10,
    description: '잘못된 요청 파라미터 에러',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'KRA_10' },
            message: { type: 'string', example: '잘못된 요청 파라미터입니다.' },
            details: {
              type: 'object',
              properties: {
                resultCode: { type: 'string', example: '10' },
                resultMsg: {
                  type: 'string',
                  example: '잘못된 요청 파라미터입니다.',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getDividendRates(
    @Query('date') date?: string,
    @Query('meet') meet?: string,
    @Query('pool') pool?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getDividendRates(
      date,
      meet,
      pool,
      pageNo,
      numOfRows
    );
  }

  @Get('entry-details')
  @ApiOperation({
    summary: '출마표 상세정보 조회 (API26_2)',
    description: '경주별 출마 말의 상세 정보를 조회합니다.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD 형식)',
    example: '2024-12-01',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiResponse({ status: 200, description: '출마표 상세정보 조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getEntryDetails(
    @Query('date') date?: string,
    @Query('meet') meet?: string
  ) {
    return this.kraApiService.getEntryDetails(date, meet);
  }

  @Get('race-plans')
  @ApiOperation({
    summary: '경주계획표 조회 (API72_2)',
    description: '한국마사회 경주계획표 정보를 조회합니다.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD 형식)',
    example: '2024-12-01',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: '경주계획표 정보 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meet: {
                type: 'string',
                description: '시행경마장구분',
                example: '1',
              },
              meet_name: {
                type: 'string',
                description: '시행경마장명',
                example: '서울',
              },
              rc_date: {
                type: 'string',
                description: '경주일자',
                example: '20241201',
              },
              rc_no: { type: 'string', description: '경주번호', example: '1' },
              rc_name: {
                type: 'string',
                description: '경주명',
                example: '3세이상일반',
              },
              rc_dist: {
                type: 'string',
                description: '경주거리',
                example: '1600',
              },
              rc_grade: {
                type: 'string',
                description: '등급조건',
                example: 'GENERAL',
              },
              rc_prize: {
                type: 'string',
                description: '1착상금',
                example: '50000000',
              },
              rc_start_time: {
                type: 'string',
                description: '발주예정시각',
                example: '14:00',
              },
              rc_rating_min: {
                type: 'string',
                description: '레이팅하한조건',
                example: '50',
              },
              rc_rating_max: {
                type: 'string',
                description: '레이팅상한조건',
                example: '80',
              },
            },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            pageNo: { type: 'number', example: 1 },
            numOfRows: { type: 'number', example: 100 },
            totalCount: { type: 'number', example: 1250 },
            totalPages: { type: 'number', example: 13 },
            validPlans: { type: 'number', example: 98 },
            invalidPlans: { type: 'number', example: 2 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getRacePlans(
    @Query('date') date?: string,
    @Query('meet') meet?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRacePlans(date, meet, pageNo, numOfRows);
  }

  @Get('race-plans/meet/:meet')
  @ApiOperation({
    summary: '특정 경마장 경주계획 조회',
    description: '지정된 경마장의 경주계획 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'meet',
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '경마장별 경주계획 조회 성공' })
  async getRacePlansByMeet(
    @Param('meet') meet: string,
    @Query('rcDate') rcDate?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRacePlansByMeet(
      meet,
      rcDate,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-plans/date/:rcDate')
  @ApiOperation({
    summary: '특정 날짜 경주계획 조회',
    description: '지정된 날짜의 모든 경주계획을 조회합니다.',
  })
  @ApiParam({
    name: 'rcDate',
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '날짜별 경주계획 조회 성공' })
  async getRacePlansByDate(
    @Param('rcDate') rcDate: string,
    @Query('meet') meet?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRacePlansByDate(
      rcDate,
      meet,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-plans/month/:rcMonth')
  @ApiOperation({
    summary: '월별 경주계획 조회',
    description: '지정된 월의 모든 경주계획을 조회합니다.',
  })
  @ApiParam({
    name: 'rcMonth',
    description: '경주월 (YYYYMM 형식)',
    example: '202412',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '월별 경주계획 조회 성공' })
  async getRacePlansByMonth(
    @Param('rcMonth') rcMonth: string,
    @Query('meet') meet?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRacePlansByMonth(
      rcMonth,
      meet,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-plans/year/:rcYear')
  @ApiOperation({
    summary: '연도별 경주계획 조회',
    description: '지정된 연도의 모든 경주계획을 조회합니다.',
  })
  @ApiParam({
    name: 'rcYear',
    description: '경주연도 (YYYY 형식)',
    example: '2024',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '연도별 경주계획 조회 성공' })
  async getRacePlansByYear(
    @Param('rcYear') rcYear: string,
    @Query('meet') meet?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getRacePlansByYear(
      rcYear,
      meet,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-plans/latest')
  @ApiOperation({
    summary: '최근 경주계획 조회',
    description: '최근 경주일의 경주계획을 조회합니다 (기본값: 최근 1개월).',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '최근 경주계획 조회 성공' })
  async getLatestRacePlans(
    @Query('meet') meet?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    return this.kraApiService.getLatestRacePlans(
      meet,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-plans/statistics')
  @ApiOperation({
    summary: '경주계획 통계 조회',
    description: '경주계획 데이터의 통계 정보를 생성합니다.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '경주일자 (YYYY-MM-DD 형식)',
    example: '2024-12-01',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: '경주계획 통계 조회 성공',
    schema: {
      type: 'object',
      properties: {
        totalPlans: {
          type: 'number',
          description: '총 경주계획 수',
          example: 12,
        },
        totalPrize: {
          type: 'number',
          description: '총 상금',
          example: 600000000,
        },
        averageDistance: {
          type: 'number',
          description: '평균 경주거리',
          example: 1600,
        },
        meetDistribution: { type: 'object', description: '경마장별 분포' },
        gradeDistribution: { type: 'object', description: '등급별 분포' },
        distanceDistribution: { type: 'object', description: '거리별 분포' },
        dateDistribution: { type: 'object', description: '날짜별 분포' },
      },
    },
  })
  async getRacePlanStatistics(
    @Query('date') date?: string,
    @Query('meet') meet?: string
  ) {
    const plans = await this.kraApiService.getRacePlans(date, meet);

    if (!plans.success || !plans.data) {
      return plans;
    }

    // 통계 정보 생성
    const statistics = await this.kraApiService.getRacePlanStatistics(
      plans.data
    );

    return {
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
      responseTime: 0,
    };
  }

  @Get('race-plans/summary/:rcDate')
  @ApiOperation({
    summary: '경주계획 요약 조회',
    description: '특정 날짜의 경주계획 요약 정보를 생성합니다.',
  })
  @ApiParam({
    name: 'rcDate',
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: '경주계획 요약 조회 성공',
    schema: {
      type: 'object',
      properties: {
        rcDate: {
          type: 'string',
          description: '경주일자',
          example: '20241201',
        },
        meet: { type: 'string', description: '시행경마장', example: '1' },
        totalRaces: { type: 'number', description: '총 경주 수', example: 12 },
        totalPrize: {
          type: 'number',
          description: '총 상금',
          example: 600000000,
        },
        averageDistance: {
          type: 'number',
          description: '평균 경주거리',
          example: 1600,
        },
        gradeDistribution: { type: 'object', description: '등급별 분포' },
        distanceDistribution: { type: 'object', description: '거리별 분포' },
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rc_no: { type: 'string', description: '경주번호', example: '1' },
              rc_name: {
                type: 'string',
                description: '경주명',
                example: '3세이상일반',
              },
              rc_dist: {
                type: 'string',
                description: '경주거리',
                example: '1600',
              },
              rc_prize: {
                type: 'string',
                description: '1착상금',
                example: '50000000',
              },
              rc_start_time: {
                type: 'string',
                description: '발주예정시각',
                example: '14:00',
              },
            },
          },
        },
      },
    },
  })
  async getRacePlanSummary(
    @Param('rcDate') rcDate: string,
    @Query('meet') meet?: string
  ) {
    const plans = await this.kraApiService.getRacePlansByDate(rcDate, meet);

    if (!plans.success || !plans.data) {
      return plans;
    }

    // 경주계획 요약 정보 생성
    const summary = await this.kraApiService.getRacePlanSummary(plans.data);

    if (!summary) {
      return {
        success: false,
        error: {
          code: 'NO_SUMMARY_DATA',
          message: '경주계획 요약 정보를 생성할 수 없습니다.',
          details: { rcDate, meet },
        },
        timestamp: new Date().toISOString(),
        responseTime: 0,
      };
    }

    return {
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
      responseTime: 0,
    };
  }

  @Get('race-plans/search')
  @ApiOperation({
    summary: '경주계획 고급 검색',
    description: '다양한 조건으로 경주계획을 검색합니다.',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'rcName',
    required: false,
    description: '경주명 (부분 일치)',
    example: '일반',
  })
  @ApiQuery({
    name: 'minDistance',
    required: false,
    description: '최소 경주거리 (미터)',
    example: 1600,
  })
  @ApiQuery({
    name: 'maxDistance',
    required: false,
    description: '최대 경주거리 (미터)',
    example: 2000,
  })
  @ApiQuery({
    name: 'grade',
    required: false,
    description: '등급조건',
    example: 'GENERAL',
  })
  @ApiQuery({
    name: 'minPrize',
    required: false,
    description: '최소 상금',
    example: 50000000,
  })
  @ApiQuery({
    name: 'maxPrize',
    required: false,
    description: '최대 상금',
    example: 100000000,
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: '최소 레이팅',
    example: 50,
  })
  @ApiQuery({
    name: 'maxRating',
    required: false,
    description: '최대 레이팅',
    example: 80,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'numOfRows',
    required: false,
    description: '한 페이지당 결과 수 (기본값: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: '경주계획 검색 성공' })
  async searchRacePlans(
    @Query('meet') meet?: string,
    @Query('rcDate') rcDate?: string,
    @Query('rcName') rcName?: string,
    @Query('minDistance') minDistance?: string,
    @Query('maxDistance') maxDistance?: string,
    @Query('grade') grade?: string,
    @Query('minPrize') minPrize?: string,
    @Query('maxPrize') maxPrize?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
    @Query('pageNo') pageNo?: string,
    @Query('numOfRows') numOfRows?: string
  ) {
    const searchCriteria = {
      meet,
      rcDate,
      rcName,
      minDistance: minDistance ? parseInt(minDistance) : undefined,
      maxDistance: maxDistance ? parseInt(maxDistance) : undefined,
      grade,
      minPrize: minPrize ? parseInt(minPrize) : undefined,
      maxPrize: maxPrize ? parseInt(maxPrize) : undefined,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
    };

    return this.kraApiService.searchRacePlans(
      searchCriteria,
      parseInt(pageNo || '1'),
      parseInt(numOfRows || '100')
    );
  }

  @Get('race-plans/calendar')
  @ApiOperation({
    summary: '경주계획 일정 캘린더',
    description: '지정된 기간의 경주계획을 날짜별로 그룹화하여 반환합니다.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: '시작일 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: '종료일 (YYYYMMDD 형식)',
    example: '20241231',
  })
  @ApiQuery({
    name: 'meet',
    required: false,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: '경주계획 캘린더 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rc_no: {
                  type: 'string',
                  description: '경주번호',
                  example: '1',
                },
                rc_name: {
                  type: 'string',
                  description: '경주명',
                  example: '3세이상일반',
                },
                rc_dist: {
                  type: 'string',
                  description: '경주거리',
                  example: '1600',
                },
                rc_start_time: {
                  type: 'string',
                  description: '발주예정시각',
                  example: '14:00',
                },
              },
            },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            startDate: { type: 'string', example: '20241201' },
            endDate: { type: 'string', example: '20241231' },
            totalDates: { type: 'number', example: 31 },
            totalPlans: { type: 'number', example: 372 },
          },
        },
      },
    },
  })
  async getRacePlanCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('meet') meet?: string
  ) {
    return this.kraApiService.getRacePlanCalendar(startDate, endDate, meet);
  }

  @Get('dividend-rates/:meet')
  @ApiOperation({
    summary: '특정 경마장 확정배당율 조회',
    description: '지정된 경마장의 확정배당율 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'meet',
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiQuery({
    name: 'rcDate',
    required: false,
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'pool',
    required: false,
    description: '승식구분',
    example: 'WIN',
  })
  @ApiResponse({ status: 200, description: '경마장별 배당율 조회 성공' })
  async getDividendRatesByMeet(
    @Query('meet') meet: string,
    @Query('rcDate') rcDate?: string,
    @Query('pool') pool?: string
  ) {
    return this.kraApiService.getDividendRatesByMeet(meet, rcDate, pool);
  }

  @Get('dividend-rates/race/:rcNo')
  @ApiOperation({
    summary: '특정 경주 확정배당율 조회',
    description: '지정된 경주의 확정배당율 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'rcNo',
    description: '경주번호 (1-12)',
    example: '1',
  })
  @ApiQuery({
    name: 'rcDate',
    required: true,
    description: '경주일자 (YYYYMMDD 형식)',
    example: '20241201',
  })
  @ApiQuery({
    name: 'meet',
    required: true,
    description: '시행경마장 (1: 서울, 2: 제주, 3: 부산)',
    example: '1',
  })
  @ApiResponse({ status: 200, description: '경주별 배당율 조회 성공' })
  async getDividendRatesByRace(
    @Query('rcNo') rcNo: string,
    @Query('rcDate') rcDate: string,
    @Query('meet') meet: string
  ) {
    return this.kraApiService.getDividendRatesByRace(rcNo, rcDate, meet);
  }
}
