import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HorsesService } from './horses.service';

@ApiTags('Horses')
@Controller('horses')
export class HorsesController {
  constructor(private horsesService: HorsesService) {}

  @Get(':hrNo/profile')
  @ApiOperation({ summary: '마필 프로필 (통산 성적, 최근 폼)' })
  getProfile(@Param('hrNo') hrNo: string) {
    return this.horsesService.getProfile(hrNo);
  }

  @Get(':hrNo/history')
  @ApiOperation({ summary: '마필 경주 이력 (페이지네이션)' })
  getHistory(
    @Param('hrNo') hrNo: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit ?? '20'), 10) || 20));
    return this.horsesService.getHistory(hrNo, pageNum, limitNum);
  }
}
