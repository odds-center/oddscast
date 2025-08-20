import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { Result } from '../entities/result.entity';

@ApiTags('results')
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  @ApiOperation({ summary: '모든 경마 결과 목록 조회' })
  @ApiResponse({ status: 200, description: '경마 결과 목록', type: [Result] })
  async findAll(): Promise<Result[]> {
    return this.resultsService.findAll();
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
}
