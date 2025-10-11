import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { BetsService } from '../../bets/bets.service';

@Controller('admin/bets')
@UseGuards(AdminGuard)
export class AdminBetsController {
  constructor(private readonly betsService: BetsService) {}

  @Get()
  async findAll(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('userId') userId?: string,
    @Query('raceId') raceId?: string,
    @Query('status') status?: string
  ) {
    // Query 파라미터를 안전하게 숫자로 변환
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    const validPage = isNaN(page) ? 1 : page;
    const validLimit = isNaN(limit) ? 20 : limit;
    // userId가 있으면 해당 유저의 베팅 조회
    if (userId) {
      const userBetsResult = await this.betsService.getUserBets(userId);
      const bets = userBetsResult.bets;

      // 필터링
      let filteredBets = bets;
      if (raceId) {
        filteredBets = bets.filter(bet => bet.raceId === raceId);
      }

      // 페이지네이션
      const startIndex = (validPage - 1) * validLimit;
      const endIndex = startIndex + validLimit;

      return {
        data: filteredBets.slice(startIndex, endIndex),
        meta: {
          total: filteredBets.length,
          page: validPage,
          limit: validLimit,
          totalPages: Math.ceil(filteredBets.length / validLimit),
        },
      };
    }

    // userId가 없으면 전체 베팅 통계만 반환
    return {
      data: [],
      meta: {
        total: 0,
        page: validPage,
        limit: validLimit,
        totalPages: 0,
      },
      message: 'userId 파라미터가 필요합니다.',
    };
  }

  @Get('statistics')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    // 통계 조회는 getBetStatistics 사용
    return { message: '베팅 통계 기능은 추후 구현 예정입니다.' };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.betsService.getBet(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.betsService.updateBet(id, { betStatus: status as any });
  }
}
