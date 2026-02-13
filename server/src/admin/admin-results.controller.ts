import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ResultsService } from '../results/results.service';
import {
  CreateResultDto,
  UpdateResultDto,
  BulkCreateResultDto,
  ResultFilterDto,
  ResultStatisticsFilterDto,
} from '../results/dto/result.dto';

/**
 * Admin 전용 Results API — /api/admin/results/*
 * Admin 클라이언트 baseURL이 /api/admin 이므로 경로: /results, /results/:id 등
 */
@ApiTags('Admin Results')
@Controller('admin/results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminResultsController {
  constructor(private resultsService: ResultsService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] 결과 목록 조회' })
  findAll(@Query() filters: ResultFilterDto) {
    return this.resultsService.findAll(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: '[Admin] 결과 통계' })
  getStatistics(@Query() filters: ResultStatisticsFilterDto) {
    return this.resultsService.getStatistics(filters);
  }

  @Get('race/:raceId')
  @ApiOperation({ summary: '[Admin] 경주별 결과 조회' })
  getByRace(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.resultsService.getByRace(raceId);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] 결과 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resultsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '[Admin] 결과 등록' })
  create(@Body() dto: CreateResultDto) {
    return this.resultsService.create(dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: '[Admin] 결과 일괄 등록' })
  bulkCreate(@Body() dto: BulkCreateResultDto) {
    return this.resultsService.bulkCreate(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] 결과 수정' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateResultDto) {
    return this.resultsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] 결과 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.resultsService.remove(id);
  }
}
