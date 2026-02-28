import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JockeysService } from './jockeys.service';

@ApiTags('Jockeys')
@Controller('jockeys')
export class JockeysController {
  constructor(private jockeysService: JockeysService) {}

  @Get(':jkNo/profile')
  @ApiOperation({ summary: '기수 프로필 (통산·경마장별 승률, 최근 폼)' })
  getProfile(@Param('jkNo') jkNo: string) {
    return this.jockeysService.getProfile(jkNo);
  }

  @Get(':jkNo/history')
  @ApiOperation({ summary: '기수 경주 이력 (페이지네이션)' })
  getHistory(
    @Param('jkNo') jkNo: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(String(limit ?? '20'), 10) || 20),
    );
    return this.jockeysService.getHistory(jkNo, pageNum, limitNum);
  }
}
