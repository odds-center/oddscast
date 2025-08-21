import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BetsService } from './bets.service';
import { CreateBetDto, UpdateBetDto } from './dto';
import { Bet, BetResult, BetStatus, BetType } from './entities/bet.entity';

@ApiTags('마권')
@Controller('bets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @ApiOperation({
    summary: '마권 구매',
    description: '새로운 마권을 구매합니다.',
  })
  @ApiBody({
    description: '마권 구매 정보',
    schema: {
      type: 'object',
      properties: {
        raceId: {
          type: 'string',
          description: '경주 ID',
          example: 'race-123',
        },
        betType: {
          type: 'string',
          enum: Object.values(BetType),
          description: '승식',
          example: 'WIN',
        },
        betName: {
          type: 'string',
          description: '마권명',
          example: '1번마 단승식',
        },
        betDescription: {
          type: 'string',
          description: '마권 설명',
          example: '1번마가 우승할 것 같습니다.',
        },
        betAmount: {
          type: 'number',
          description: '마권 금액 (포인트)',
          example: 1000,
        },
        selections: {
          type: 'object',
          properties: {
            horses: {
              type: 'array',
              items: { type: 'string' },
              description: '선택한 마번들',
              example: ['1'],
            },
            positions: {
              type: 'array',
              items: { type: 'number' },
              description: '순서 (쌍승식 마권의 경우)',
              example: [1, 2],
            },
            combinations: {
              type: 'array',
              items: {
                type: 'array',
                items: { type: 'string' },
              },
              description: '조합 (복합 마권의 경우)',
            },
          },
          required: ['horses'],
        },
        betReason: {
          type: 'string',
          description: '마권 구매 이유',
          example: '최근 상태가 좋고 기수도 유능합니다.',
        },
        confidenceLevel: {
          type: 'number',
          description: '신뢰도 (0-100)',
          example: 75,
        },
        analysisData: {
          type: 'object',
          description: '분석 데이터',
        },
      },
      required: ['raceId', 'betType', 'betName', 'betAmount', 'selections'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '마권 구매 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'bet-uuid' },
        betType: { type: 'string', example: 'WIN' },
        betName: { type: 'string', example: '1번마 단승식' },
        betAmount: { type: 'number', example: 1000 },
        odds: { type: 'number', example: 3.5 },
        potentialWin: { type: 'number', example: 3500 },
        betStatus: { type: 'string', example: 'PENDING' },
        betTime: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '경주 또는 사용자를 찾을 수 없음' })
  async createBet(
    @Body() createBetDto: CreateBetDto,
    @Request() req: any
  ): Promise<Bet> {
    const userId = req.user.id;
    return this.betsService.createBet({ ...createBetDto, userId });
  }

  @Get(':id')
  @ApiOperation({
    summary: '마권 조회',
    description: '특정 마권의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '마권 ID',
    example: 'bet-uuid',
  })
  @ApiResponse({
    status: 200,
    description: '마권 조회 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'bet-uuid' },
        betType: { type: 'string', example: 'WIN' },
        betName: { type: 'string', example: '1번마 단승식' },
        betAmount: { type: 'number', example: 1000 },
        odds: { type: 'number', example: 3.5 },
        potentialWin: { type: 'number', example: 3500 },
        betStatus: { type: 'string', example: 'PENDING' },
        betResult: { type: 'string', example: 'PENDING' },
        betTime: { type: 'string', format: 'date-time' },
        race: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'race-123' },
            rcName: { type: 'string', example: '3세이상일반' },
            rcDate: { type: 'string', example: '20241201' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '마권을 찾을 수 없음' })
  async getBet(@Param('id') id: string): Promise<Bet> {
    return this.betsService.getBet(id);
  }

  @Get()
  @ApiOperation({
    summary: '사용자 마권 목록 조회',
    description: '현재 사용자의 마권 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '한 페이지당 결과 수',
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '마권 상태 필터',
    enum: BetStatus,
  })
  @ApiQuery({
    name: 'result',
    required: false,
    description: '마권 결과 필터',
    enum: BetResult,
  })
  @ApiResponse({
    status: 200,
    description: '마권 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        bets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'bet-uuid' },
              betType: { type: 'string', example: 'WIN' },
              betName: { type: 'string', example: '1번마 단승식' },
              betAmount: { type: 'number', example: 1000 },
              betStatus: { type: 'string', example: 'PENDING' },
              betResult: { type: 'string', example: 'PENDING' },
              betTime: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  async getUserBets(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: BetStatus,
    @Query('result') result?: BetResult
  ) {
    const userId = req.user.id;
    return this.betsService.getUserBets(userId, page, limit, status, result);
  }

  @Get('race/:raceId')
  @ApiOperation({
    summary: '경주별 마권 목록 조회',
    description: '특정 경주의 모든 마권 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'raceId',
    description: '경주 ID',
    example: 'race-123',
  })
  @ApiResponse({
    status: 200,
    description: '경주별 마권 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'bet-uuid' },
          betType: { type: 'string', example: 'WIN' },
          betName: { type: 'string', example: '1번마 단승식' },
          betAmount: { type: 'number', example: 1000 },
          betStatus: { type: 'string', example: 'PENDING' },
          betTime: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'user-uuid' },
              name: { type: 'string', example: '사용자명' },
            },
          },
        },
      },
    },
  })
  async getRaceBets(@Param('raceId') raceId: string): Promise<Bet[]> {
    return this.betsService.getRaceBets(raceId);
  }

  @Put(':id')
  @ApiOperation({
    summary: '마권 업데이트',
    description: '마권 정보를 업데이트합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '마권 ID',
    example: 'bet-uuid',
  })
  @ApiBody({
    description: '마권 업데이트 정보',
    schema: {
      type: 'object',
      properties: {
        betStatus: {
          type: 'string',
          enum: Object.values(BetStatus),
          description: '마권 상태',
        },
        betResult: {
          type: 'string',
          enum: Object.values(BetResult),
          description: '마권 결과',
        },
        actualWin: {
          type: 'number',
          description: '실제 당첨금',
          example: 3500,
        },
        actualOdds: {
          type: 'number',
          description: '실제 배당률',
          example: 3.5,
        },
        raceResult: {
          type: 'object',
          description: '경주 결과',
        },
        notes: {
          type: 'string',
          description: '메모',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '마권 업데이트 성공',
  })
  @ApiResponse({ status: 404, description: '마권을 찾을 수 없음' })
  async updateBet(
    @Param('id') id: string,
    @Body() updateBetDto: UpdateBetDto
  ): Promise<Bet> {
    return this.betsService.updateBet(id, updateBetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '마권 취소',
    description: '마권을 취소하고 포인트를 환불합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '마권 ID',
    example: 'bet-uuid',
  })
  @ApiResponse({
    status: 204,
    description: '마권 취소 성공',
  })
  @ApiResponse({ status: 400, description: '취소할 수 없는 마권' })
  @ApiResponse({ status: 404, description: '마권을 찾을 수 없음' })
  async cancelBet(@Param('id') id: string): Promise<void> {
    await this.betsService.cancelBet(id);
  }

  @Get('statistics/summary')
  @ApiOperation({
    summary: '마권 통계 요약',
    description: '현재 사용자의 마권 통계 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '마권 통계 조회 성공',
    schema: {
      type: 'object',
      properties: {
        totalBets: { type: 'number', example: 50 },
        wonBets: { type: 'number', example: 15 },
        lostBets: { type: 'number', example: 35 },
        winRate: { type: 'number', example: 30.0 },
        totalWinnings: { type: 'number', example: 15000 },
        totalLosses: { type: 'number', example: 35000 },
        roi: { type: 'number', example: -40.0 },
        averageBetAmount: { type: 'number', example: 1000 },
        favoriteBetType: { type: 'string', example: 'WIN' },
        recentPerformance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'bet-uuid' },
              betType: { type: 'string', example: 'WIN' },
              betAmount: { type: 'number', example: 1000 },
              result: { type: 'string', example: 'WIN' },
              actualWin: { type: 'number', example: 3500 },
              betTime: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async getBetStatistics(@Request() req: any) {
    const userId = req.user.id;
    return this.betsService.getBetStatistics(userId);
  }

  @Get('types')
  @ApiOperation({
    summary: '승식 목록',
    description: '사용 가능한 승식 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '승식 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string', example: 'WIN' },
          label: { type: 'string', example: '단승식' },
          description: { type: 'string', example: '1마리가 1등을 하는 마권' },
          minHorses: { type: 'number', example: 1 },
          maxHorses: { type: 'number', example: 1 },
          requiresOrder: { type: 'boolean', example: false },
        },
      },
    },
  })
  async getBetTypes() {
    return [
      {
        value: BetType.WIN,
        label: '단승식',
        description: '1마리가 1등을 하는 마권',
        minHorses: 1,
        maxHorses: 1,
        requiresOrder: false,
      },
      {
        value: BetType.PLACE,
        label: '복승식',
        description: '1마리가 1등, 2등, 3등 중 하나를 하는 마권',
        minHorses: 1,
        maxHorses: 1,
        requiresOrder: false,
      },
      {
        value: BetType.QUINELLA,
        label: '연승식',
        description: '2마리가 1등, 2등을 하는 마권 (순서 무관)',
        minHorses: 2,
        maxHorses: 2,
        requiresOrder: false,
      },
      {
        value: BetType.QUINELLA_PLACE,
        label: '복연승식',
        description: '2마리가 1등, 2등, 3등 중 두 자리를 하는 마권',
        minHorses: 2,
        maxHorses: 2,
        requiresOrder: false,
      },
      {
        value: BetType.EXACTA,
        label: '쌍승식',
        description: '2마리가 정확한 순서로 1등, 2등을 하는 마권',
        minHorses: 2,
        maxHorses: 2,
        requiresOrder: true,
      },
      {
        value: BetType.TRIFECTA,
        label: '삼복승식',
        description: '3마리가 1등, 2등, 3등을 하는 마권 (순서 무관)',
        minHorses: 3,
        maxHorses: 3,
        requiresOrder: false,
      },
      {
        value: BetType.TRIPLE,
        label: '삼쌍승식',
        description: '3마리가 정확한 순서로 1등, 2등, 3등을 하는 마권',
        minHorses: 3,
        maxHorses: 3,
        requiresOrder: true,
      },
    ];
  }
}
