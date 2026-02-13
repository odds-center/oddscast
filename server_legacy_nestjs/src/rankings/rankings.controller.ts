import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RankingsService } from './rankings.service';
import { RankingQueryDto } from './dto/ranking-query.dto';
import {
  RankingsResponseDto,
  MyRankingResponseDto,
} from './dto/ranking-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RankingType } from './entities/user-ranking.entity';

@ApiTags('Rankings')
@Controller('rankings')
export class RankingsController {
  private readonly logger = new Logger(RankingsController.name);

  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  @ApiOperation({ summary: '랭킹 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '랭킹 목록 반환',
    type: RankingsResponseDto,
  })
  async getRankings(
    @Query() query: RankingQueryDto
  ): Promise<RankingsResponseDto> {
    this.logger.log(
      `랭킹 조회 요청: type=${query.type}, limit=${query.limit}, page=${query.page}`
    );
    return await this.rankingsService.getRankings(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 랭킹 조회' })
  @ApiResponse({
    status: 200,
    description: '내 랭킹 정보 반환',
    type: MyRankingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getMyRanking(
    @Request() req,
    @Query('type') type?: RankingType
  ): Promise<MyRankingResponseDto> {
    const userId = req.user.userId;
    const rankingType = type || RankingType.OVERALL;

    this.logger.log(`내 랭킹 조회 요청: userId=${userId}, type=${rankingType}`);
    return await this.rankingsService.getMyRanking(userId, rankingType);
  }
}
