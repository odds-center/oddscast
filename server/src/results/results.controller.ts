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
import { ResultsService } from './results.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/db-enums';
import {
  CreateResultDto,
  UpdateResultDto,
  BulkCreateResultDto,
  BulkUpdateResultDto,
  ResultFilterDto,
  ResultSearchDto,
  ResultStatisticsFilterDto,
} from './dto/result.dto';

@ApiTags('Results')
@Controller('results')
export class ResultsController {
  constructor(private resultsService: ResultsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  @ApiOperation({ summary: '결과 목록 조회' })
  findAll(@Query() filters: ResultFilterDto) {
    return this.resultsService.findAll(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: '결과 통계' })
  getStatistics(@Query() filters: ResultStatisticsFilterDto) {
    return this.resultsService.getStatistics(filters);
  }

  @Get('export')
  @ApiOperation({ summary: '결과 내보내기' })
  exportResults(
    @Query('format') format: string = 'json',
    @Query() filters: ResultStatisticsFilterDto,
  ) {
    return this.resultsService.exportResults(format, filters);
  }

  @Get('search')
  @ApiOperation({ summary: '결과 검색 (q: 마명/출전번호/기수명)' })
  search(@Query() filters: ResultSearchDto) {
    return this.resultsService.search(filters);
  }

  @Get('validate/:raceId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '경주별 결과 검증' })
  validate(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.resultsService.validateByRaceId(raceId);
  }

  @Get('race/:raceId')
  @ApiOperation({ summary: '경주별 결과 조회' })
  getByRace(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.resultsService.getByRace(raceId);
  }

  @Get(':id')
  @ApiOperation({ summary: '결과 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resultsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '결과 등록 (Admin)' })
  create(@Body() dto: CreateResultDto) {
    return this.resultsService.create(dto);
  }

  @Post('bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '결과 일괄 등록 (Admin)' })
  bulkCreate(@Body() dto: BulkCreateResultDto) {
    return this.resultsService.bulkCreate(dto);
  }

  @Put('bulk-update')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '결과 일괄 수정 (Admin)' })
  bulkUpdate(@Body() dto: BulkUpdateResultDto) {
    return this.resultsService.bulkUpdate(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '결과 수정 (Admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateResultDto) {
    return this.resultsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '결과 삭제 (Admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.resultsService.remove(id);
  }
}
