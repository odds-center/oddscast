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
import { RacesService } from '../../races/races.service';

@Controller('admin/races')
@UseGuards(AdminGuard)
export class AdminRacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get()
  async findAll(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('date') date?: string,
    @Query('track') track?: string,
    @Query('status') status?: string
  ) {
    // Query 파라미터를 안전하게 숫자로 변환
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    const validPage = isNaN(page) ? 1 : page;
    const validLimit = isNaN(limit) ? 20 : limit;

    let races = await this.racesService.findAll();

    // 필터링
    if (date) {
      races = races.filter(race => race.rcDate === date);
    }
    if (track) {
      races = races.filter(race => race.meet === track);
    }

    // 페이지네이션
    const startIndex = (validPage - 1) * validLimit;
    const endIndex = startIndex + validLimit;

    return {
      data: races.slice(startIndex, endIndex),
      meta: {
        total: races.length,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(races.length / validLimit),
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.racesService.findById(id);
  }

  @Post()
  async create(@Body() createRaceDto: any) {
    return this.racesService.create(createRaceDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRaceDto: any) {
    return this.racesService.update(id, updateRaceDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.racesService.delete(id);
  }
}
