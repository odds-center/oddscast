import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';

@ApiTags('Trainers')
@Controller('trainers')
export class TrainersController {
  constructor(private trainersService: TrainersService) {}

  @Get(':trName/profile')
  @ApiOperation({ summary: '조교사 프로필 (통산·경마장별 승률, 최근 폼)' })
  getProfile(@Param('trName') trName: string) {
    return this.trainersService.getProfile(decodeURIComponent(trName));
  }

  @Get(':trName/history')
  @ApiOperation({ summary: '조교사 경주 이력 (페이지네이션)' })
  getHistory(
    @Param('trName') trName: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const decoded = decodeURIComponent(trName);
    const pageNum = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(String(limit ?? '20'), 10) || 20),
    );
    return this.trainersService.getHistory(decoded, pageNum, limitNum);
  }
}
