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
import { RacesService } from './races.service';
import { Race } from '../entities/race.entity';

@ApiTags('races')
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get()
  @ApiOperation({ summary: '모든 경마 목록 조회' })
  @ApiResponse({ status: 200, description: '경마 목록', type: [Race] })
  async findAll(): Promise<Race[]> {
    return this.racesService.findAll();
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
}
