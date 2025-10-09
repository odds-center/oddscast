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
import { Race } from './entities/race.entity';
import { RacesService } from './races.service';
import { KraApiIntegratedService } from '../kra-api/kra-api-integrated.service';

@ApiTags('races')
@Controller('races')
export class RacesController {
  constructor(
    private readonly racesService: RacesService,
    private readonly kraApiService: KraApiIntegratedService
  ) {}

  @Get()
  @ApiOperation({ summary: '모든 경마 목록 조회 (Mobile 호환)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 개수' })
  @ApiQuery({ name: 'meet', required: false, description: '경마장 코드' })
  @ApiQuery({ name: 'date', required: false, description: '날짜' })
  @ApiQuery({ name: 'month', required: false, description: '월' })
  @ApiQuery({ name: 'year', required: false, description: '연도' })
  @ApiQuery({ name: 'grade', required: false, description: '등급' })
  @ApiQuery({ name: 'distance', required: false, description: '거리' })
  @ApiQuery({ name: 'status', required: false, description: '상태' })
  @ApiResponse({ status: 200, description: '경마 목록' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('meet') meet?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('grade') grade?: string,
    @Query('distance') distance?: string,
    @Query('status') status?: string
  ): Promise<{
    races: Race[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      let races = await this.racesService.findAll();

      // 필터링 적용
      if (meet) {
        races = races.filter(race => race.meet === meet);
      }
      if (date) {
        const normalizedDate = date.replace(/-/g, '');
        races = races.filter(race => race.rcDate === normalizedDate);
      }
      if (grade) {
        races = races.filter(race => race.rcGrade === grade);
      }
      if (status) {
        races = races.filter(race => race.raceStatus === status);
      }

      // 페이지네이션
      const pageNum = parseInt(page || '1');
      const limitNum = parseInt(limit || '10');
      const total = races.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedRaces = races.slice(startIndex, endIndex);

      return {
        races: paginatedRaces,
        total,
        page: pageNum,
        totalPages,
      };
    } catch (error) {
      return {
        races: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }

  @Get('date/:date')
  @ApiOperation({ summary: '특정 날짜의 경마 목록 조회' })
  @ApiParam({ name: 'date', description: '날짜 (YYYY-MM-DD 형식)' })
  @ApiResponse({
    status: 200,
    description: '해당 날짜의 경마 목록',
    type: [Race],
  })
  async findByDate(@Param('date') date: string): Promise<Race[]> {
    return this.racesService.findByDate(date);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 경마 상세 조회' })
  @ApiParam({ name: 'id', description: '경마 ID' })
  @ApiResponse({ status: 200, description: '경마 상세 정보', type: Race })
  async findById(@Param('id') id: string): Promise<Race | null> {
    return this.racesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '새 경마 생성' })
  @ApiResponse({ status: 201, description: '경마 생성 완료', type: Race })
  async create(@Body() raceData: Partial<Race>): Promise<Race> {
    return this.racesService.create(raceData);
  }

  @Put(':id')
  @ApiOperation({ summary: '경마 정보 수정' })
  @ApiParam({ name: 'id', description: '경마 ID' })
  @ApiResponse({ status: 200, description: '경마 수정 완료', type: Race })
  async update(
    @Param('id') id: string,
    @Body() raceData: Partial<Race>
  ): Promise<Race | null> {
    return this.racesService.update(id, raceData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '경마 삭제' })
  @ApiParam({ name: 'id', description: '경마 ID' })
  @ApiResponse({ status: 200, description: '경마 삭제 완료' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.racesService.delete(id);
  }

  // ============================================
  // Mobile App을 위한 확장 엔드포인트
  // ============================================

  @Get('schedule')
  @ApiOperation({ summary: '경주 일정 조회 (Mobile)' })
  @ApiQuery({ name: 'meet', required: false, description: '경마장 코드' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '날짜 (YYYYMMDD 또는 YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'month', required: false, description: '월 (YYYYMM)' })
  @ApiQuery({ name: 'year', required: false, description: '연도 (YYYY)' })
  @ApiResponse({ status: 200, description: '경주 일정 목록' })
  async getRaceSchedule(
    @Query('meet') meet?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string
  ) {
    try {
      // 날짜 정규화 (YYYY-MM-DD -> YYYYMMDD)
      const normalizedDate = date ? date.replace(/-/g, '') : undefined;

      if (normalizedDate) {
        return await this.kraApiService.getRaceSchedule(normalizedDate);
      }

      // 날짜가 없으면 오늘 기준
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      return await this.kraApiService.getRaceSchedule(today);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get(':raceId/results')
  @ApiOperation({ summary: '특정 경주의 결과 조회 (Mobile)' })
  @ApiParam({ name: 'raceId', description: '경주 ID (meet_rcDate_rcNo)' })
  @ApiResponse({ status: 200, description: '경주 결과 목록' })
  async getRaceResults(@Param('raceId') raceId: string) {
    try {
      const [meet, rcDate, rcNo] = raceId.split('_');
      return await this.kraApiService.getRaceResults(rcDate, meet, rcNo);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get(':raceId/dividends')
  @ApiOperation({ summary: '특정 경주의 배당율 조회 (Mobile)' })
  @ApiParam({ name: 'raceId', description: '경주 ID (meet_rcDate_rcNo)' })
  @ApiResponse({ status: 200, description: '배당율 목록' })
  async getRaceDividends(@Param('raceId') raceId: string) {
    try {
      const [meet, rcDate, rcNo] = raceId.split('_');
      return await this.kraApiService.getRaceDividends(rcDate, meet, rcNo);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get(':raceId/entries')
  @ApiOperation({ summary: '특정 경주의 출전표 조회 (Mobile)' })
  @ApiParam({ name: 'raceId', description: '경주 ID (meet_rcDate_rcNo)' })
  @ApiResponse({ status: 200, description: '출전표 목록' })
  async getRaceEntries(@Param('raceId') raceId: string) {
    try {
      const [meet, rcDate, rcNo] = raceId.split('_');
      return await this.kraApiService.getRaceEntries(rcDate, meet, rcNo);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: '경주 통계 조회 (Mobile)' })
  @ApiQuery({ name: 'meet', required: false, description: '경마장 코드' })
  @ApiQuery({ name: 'date', required: false, description: '날짜' })
  @ApiQuery({ name: 'month', required: false, description: '월' })
  @ApiQuery({ name: 'year', required: false, description: '연도' })
  @ApiResponse({ status: 200, description: '경주 통계' })
  async getRaceStatistics(
    @Query('meet') meet?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string
  ) {
    try {
      const normalizedDate = date
        ? date.replace(/-/g, '')
        : new Date().toISOString().split('T')[0].replace(/-/g, '');
      return await this.kraApiService.getGroupedDividends(normalizedDate, meet);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('calendar')
  @ApiOperation({ summary: '경주 캘린더 조회 (Mobile)' })
  @ApiQuery({ name: 'year', required: true, description: '연도 (YYYY)' })
  @ApiQuery({ name: 'month', required: false, description: '월 (MM)' })
  @ApiResponse({ status: 200, description: '경주 캘린더' })
  async getRaceCalendar(
    @Query('year') year: string,
    @Query('month') month?: string
  ) {
    try {
      const days = parseInt(month) ? 31 : 365;
      return await this.kraApiService.getUpcomingRacePlans(days);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('search')
  @ApiOperation({ summary: '경주 검색 (Mobile)' })
  @ApiQuery({ name: 'q', required: true, description: '검색어' })
  @ApiQuery({ name: 'meet', required: false, description: '경마장 코드' })
  @ApiQuery({ name: 'page', required: false, description: '페이지' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 개수' })
  @ApiResponse({ status: 200, description: '검색 결과' })
  async searchRaces(
    @Query('q') query: string,
    @Query('meet') meet?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const races = await this.racesService.findAll();
      const filtered = races.filter(
        race => race.rcName.includes(query) || race.meetName.includes(query)
      );

      return {
        races: filtered,
        total: filtered.length,
        page: parseInt(page || '1'),
        totalPages: Math.ceil(filtered.length / parseInt(limit || '10')),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
