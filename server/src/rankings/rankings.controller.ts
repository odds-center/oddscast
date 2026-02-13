import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';

@ApiTags('Rankings')
@Controller('rankings')
export class RankingsController {
  constructor(private rankingsService: RankingsService) {}

  @Get()
  @ApiOperation({ summary: '랭킹 조회' })
  getRankings(@Query('type') type?: string, @Query('limit') limit?: number) {
    return this.rankingsService.getRankings(type, limit);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 랭킹 조회' })
  getMyRanking(@CurrentUser() user: JwtPayload, @Query('type') type?: string) {
    return this.rankingsService.getMyRanking(user.sub, type);
  }
}
