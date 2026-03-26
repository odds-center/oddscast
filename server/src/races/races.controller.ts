import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Header,
} from '@nestjs/common';
import { RacesService } from './races.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/db-enums';
import {
  CreateRaceDto,
  UpdateRaceDto,
  RaceFilterDto,
  CreateRaceEntryDto,
} from './dto/race.dto';

@ApiTags('Races')
@Controller('races')
export class RacesController {
  constructor(private racesService: RacesService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  @ApiOperation({ summary: '경주 목록 조회' })
  findAll(@Query() filters: RaceFilterDto) {
    return this.racesService.findAll(filters);
  }

  @Get('today')
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  @ApiOperation({ summary: '오늘 경주 목록' })
  getTodayRaces() {
    return this.racesService.getTodayRaces();
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: '날짜별 경기 목록 (YYYYMMDD 또는 YYYY-MM-DD)' })
  getRacesByDate(@Param('date') date: string) {
    return this.racesService.getRacesByDate(date);
  }

  @Get('schedule')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: '경주 일정 조회' })
  getSchedule(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('meet') meet?: string,
  ) {
    return this.racesService.getSchedule({ dateFrom, dateTo, meet });
  }

  @Get('search')
  @ApiOperation({ summary: '경주 검색' })
  search(
    @Query('q') q?: string,
    @Query('meet') meet?: string,
    @Query('grade') grade?: string,
    @Query('distance') distance?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.racesService.findAll({
      q,
      meet,
      status,
      page,
      limit,
    });
  }

  @Get('calendar')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: '경주 달력' })
  getCalendar(@Query('year') year?: number, @Query('month') month?: number) {
    const dateFrom =
      year && month ? `${year}${String(month).padStart(2, '0')}01` : undefined;
    const dateTo =
      year && month ? `${year}${String(month).padStart(2, '0')}31` : undefined;
    return this.racesService.getSchedule({ dateFrom, dateTo });
  }

  @Get('schedule-dates')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: '경마 시행일 목록 (날짜별·경마장별 경주 수)' })
  getScheduleDates(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('meet') meet?: string,
  ) {
    return this.racesService.getScheduleDates({ dateFrom, dateTo, meet });
  }

  @Get('statistics')
  @ApiOperation({ summary: '경주 통계' })
  getStatistics(
    @Query('meet') meet?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.racesService.getStatistics({ meet, date, month, year });
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  @ApiOperation({ summary: '경주 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '경주 생성' })
  create(@Body() dto: CreateRaceDto) {
    return this.racesService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '경주 수정' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRaceDto) {
    return this.racesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '경주 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.remove(id);
  }

  @Get(':id/results')
  @ApiOperation({ summary: '경주 결과 조회' })
  getRaceResults(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.getRaceResult(id);
  }

  @Get(':id/result')
  @ApiOperation({ summary: '경주 결과 조회 (singular alias)' })
  getRaceResult(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.getRaceResult(id);
  }

  @Get(':id/entries')
  @ApiOperation({ summary: '출전마 목록 조회' })
  getEntries(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.findOne(id);
  }

  @Get(':id/dividends')
  @ApiOperation({
    summary: '승식별 배당률 조회 (경주 결과에서 단승식·연승식 배당률 반환)',
  })
  getDividends(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.getDividends(id);
  }

  @Get(':id/analysis')
  @ApiOperation({ summary: '경주 AI 분석 조회' })
  getAnalysis(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.getAnalysis(id);
  }

  @Post(':id/entries')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '출전마 등록' })
  createEntry(
    @Param('id', ParseIntPipe) raceId: number,
    @Body() dto: CreateRaceEntryDto,
  ) {
    return this.racesService.createEntry(raceId, dto);
  }

  @Post(':id/entries/bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '출전마 일괄 등록' })
  createBulkEntries(
    @Param('id', ParseIntPipe) raceId: number,
    @Body() body: { entries: CreateRaceEntryDto[] },
  ) {
    return this.racesService.createBulkEntries(raceId, body.entries);
  }
}
