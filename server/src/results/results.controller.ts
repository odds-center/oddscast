import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Result } from './entities/result.entity';
import { ResultsService } from './results.service';
import { KraApiIntegratedService } from '../kra-api/kra-api-integrated.service';

@ApiTags('results')
@Controller('results')
export class ResultsController {
  constructor(
    private readonly resultsService: ResultsService,
    private readonly kraApiService: KraApiIntegratedService
  ) {}

  @Get()
  @ApiOperation({ summary: '모든 경마 결과 목록 조회 (Mobile 호환)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 개수' })
  @ApiQuery({ name: 'raceId', required: false, description: '경주 ID' })
  @ApiQuery({ name: 'meet', required: false, description: '경마장 코드' })
  @ApiQuery({ name: 'date', required: false, description: '날짜' })
  @ApiQuery({ name: 'month', required: false, description: '월' })
  @ApiQuery({ name: 'year', required: false, description: '연도' })
  @ApiResponse({ status: 200, description: '경마 결과 목록' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('raceId') raceId?: string,
    @Query('meet') meet?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string
  ): Promise<{
    results: Result[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      let results = await this.resultsService.findAll();

      // 필터링 적용
      if (raceId) {
        results = results.filter(result => result.raceId === raceId);
      }
      if (meet) {
        results = results.filter(result => result.meet === meet);
      }
      if (date) {
        const normalizedDate = date.replace(/-/g, '');
        results = results.filter(result => result.rcDate === normalizedDate);
      }

      // 페이지네이션
      const pageNum = parseInt(page || '1');
      const limitNum = parseInt(limit || '20');
      const total = results.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedResults = results.slice(startIndex, endIndex);

      return {
        results: paginatedResults,
        total,
        page: pageNum,
        totalPages,
      };
    } catch (error) {
      return {
        results: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }

  @Get('race/:raceId')
  @ApiOperation({ summary: '특정 경마의 결과 목록 조회' })
  @ApiParam({ name: 'raceId', description: '경마 ID' })
  @ApiResponse({
    status: 200,
    description: '해당 경마의 결과 목록',
    type: [Result],
  })
  async findByRaceId(@Param('raceId') raceId: string): Promise<Result[]> {
    return this.resultsService.findByRaceId(raceId);
  }

  @Get('date/:date')
  @ApiOperation({ summary: '특정 날짜의 경마 결과 목록 조회' })
  @ApiParam({ name: 'date', description: '날짜 (YYYYMMDD 형식)' })
  @ApiResponse({
    status: 200,
    description: '해당 날짜의 경마 결과 목록',
    type: [Result],
  })
  async findByDate(@Param('date') date: string): Promise<Result[]> {
    return this.resultsService.findByDate(date);
  }

  @Get(':resultId')
  @ApiOperation({ summary: '특정 경마 결과 상세 조회' })
  @ApiParam({ name: 'resultId', description: '결과 ID' })
  @ApiResponse({
    status: 200,
    description: '경마 결과 상세 정보',
    type: Result,
  })
  async findById(@Param('resultId') resultId: string): Promise<Result | null> {
    return this.resultsService.findById(resultId);
  }

  @Post()
  @ApiOperation({ summary: '새 경마 결과 생성' })
  @ApiResponse({
    status: 201,
    description: '경마 결과 생성 완료',
    type: Result,
  })
  async create(@Body() resultData: Partial<Result>): Promise<Result> {
    return this.resultsService.create(resultData);
  }

  @Put(':resultId')
  @ApiOperation({ summary: '경마 결과 정보 수정' })
  @ApiParam({ name: 'resultId', description: '결과 ID' })
  @ApiResponse({
    status: 200,
    description: '경마 결과 수정 완료',
    type: Result,
  })
  async update(
    @Param('resultId') resultId: string,
    @Body() resultData: Partial<Result>
  ): Promise<Result | null> {
    return this.resultsService.update(resultId, resultData);
  }

  @Delete(':resultId')
  @ApiOperation({ summary: '경마 결과 삭제' })
  @ApiParam({ name: 'resultId', description: '결과 ID' })
  @ApiResponse({ status: 200, description: '경마 결과 삭제 완료' })
  async delete(@Param('resultId') resultId: string): Promise<void> {
    return this.resultsService.delete(resultId);
  }

  // ============================================
  // Mobile App을 위한 확장 엔드포인트
  // ============================================

  @Get('statistics')
  @ApiOperation({ summary: '경주 결과 통계 조회 (Mobile)' })
  @ApiQuery({ name: 'meet', required: false, description: '경마장 코드' })
  @ApiQuery({ name: 'date', required: false, description: '날짜' })
  @ApiQuery({ name: 'month', required: false, description: '월' })
  @ApiQuery({ name: 'year', required: false, description: '연도' })
  @ApiResponse({ status: 200, description: '경주 결과 통계' })
  async getResultStatistics(
    @Query('meet') meet?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string
  ) {
    try {
      const results = await this.resultsService.findAll();

      // 필터링
      let filtered = results;
      if (meet) filtered = filtered.filter(r => r.meet === meet);
      if (date) {
        const normalizedDate = date.replace(/-/g, '');
        filtered = filtered.filter(r => r.rcDate === normalizedDate);
      }

      // 통계 계산
      const totalResults = filtered.length;
      const byMeet: Record<string, number> = {};
      const byGrade: Record<string, number> = {};

      filtered.forEach(result => {
        byMeet[result.meetName] = (byMeet[result.meetName] || 0) + 1;
        byGrade[result.rcGrade] = (byGrade[result.rcGrade] || 0) + 1;
      });

      return {
        totalRaces: new Set(filtered.map(r => r.raceId)).size,
        totalResults,
        byMeet,
        byGrade,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('search')
  @ApiOperation({ summary: '경주 결과 검색 (Mobile)' })
  @ApiQuery({ name: 'q', required: true, description: '검색어' })
  @ApiQuery({ name: 'meet', required: false, description: '경마장 코드' })
  @ApiQuery({ name: 'page', required: false, description: '페이지' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 개수' })
  @ApiResponse({ status: 200, description: '검색 결과' })
  async searchResults(
    @Query('q') query: string,
    @Query('meet') meet?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const results = await this.resultsService.findAll();
      const filtered = results.filter(
        result =>
          result.hrName.includes(query) ||
          result.jkName.includes(query) ||
          result.trName.includes(query) ||
          result.rcName.includes(query)
      );

      if (meet) {
        filtered.filter(r => r.meet === meet);
      }

      const pageNum = parseInt(page || '1');
      const limitNum = parseInt(limit || '20');
      const total = filtered.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedResults = filtered.slice(
        startIndex,
        startIndex + limitNum
      );

      return {
        results: paginatedResults,
        total,
        page: pageNum,
        totalPages,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
