import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { ResultsService } from '../../results/results.service';

@Controller('admin/results')
@UseGuards(AdminGuard)
export class AdminResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  async findAll(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('date') date?: string,
    @Query('raceId') raceId?: string
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    const validPage = isNaN(page) ? 1 : page;
    const validLimit = isNaN(limit) ? 20 : limit;

    let results = await this.resultsService.findAll();

    // 필터링
    if (date) {
      results = results.filter(result => result.rcDate === date);
    }
    if (raceId) {
      results = results.filter(result => result.raceId === raceId);
    }

    // 페이지네이션
    const startIndex = (validPage - 1) * validLimit;
    const endIndex = startIndex + validLimit;

    return {
      data: results.slice(startIndex, endIndex),
      meta: {
        total: results.length,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(results.length / validLimit),
      },
    };
  }

  @Get('race/:raceId')
  async findByRaceId(@Param('raceId') raceId: string) {
    return this.resultsService.findByRaceId(raceId);
  }

  @Get('date/:date')
  async findByDate(@Param('date') date: string) {
    return this.resultsService.findByDate(date);
  }

  @Get(':resultId')
  async findOne(@Param('resultId') resultId: string) {
    return this.resultsService.findById(resultId);
  }

  @Post()
  async create(@Body() createResultDto: any) {
    return this.resultsService.create(createResultDto);
  }

  @Patch(':resultId')
  async update(
    @Param('resultId') resultId: string,
    @Body() updateResultDto: any
  ) {
    return this.resultsService.update(resultId, updateResultDto);
  }

  @Delete(':resultId')
  async remove(@Param('resultId') resultId: string) {
    return this.resultsService.delete(resultId);
  }
}
