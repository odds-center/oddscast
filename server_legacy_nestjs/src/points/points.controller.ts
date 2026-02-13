import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('포인트')
@Controller('points')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get(':userId/balance')
  @ApiOperation({
    summary: '사용자 포인트 잔액 조회',
    description: '특정 사용자의 포인트 잔액을 조회합니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    example: 'user-uuid',
  })
  @ApiResponse({
    status: 200,
    description: '포인트 잔액 조회 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'balance-uuid' },
        userId: { type: 'string', example: 'user-uuid' },
        currentPoints: { type: 'number', example: 1000 },
        totalPointsEarned: { type: 'number', example: 5000 },
        totalPointsSpent: { type: 'number', example: 4000 },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getUserPointBalance(@Param('userId') userId: string) {
    return this.pointsService.getUserPointBalance(userId);
  }

  @Get(':userId/transactions')
  @ApiOperation({
    summary: '사용자 포인트 거래 내역 조회',
    description: '특정 사용자의 포인트 거래 내역을 조회합니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    example: 'user-uuid',
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
    name: 'type',
    required: false,
    description: '거래 타입 필터',
    example: 'EARNED',
  })
  @ApiResponse({
    status: 200,
    description: '포인트 거래 내역 조회 성공',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'transaction-uuid' },
              userId: { type: 'string', example: 'user-uuid' },
              amount: { type: 'number', example: 100 },
              type: { type: 'string', example: 'EARNED' },
              description: { type: 'string', example: '포인트 적립' },
              balanceAfter: { type: 'number', example: 1100 },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  async getPointTransactions(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('type') type?: string
  ) {
    return this.pointsService.getUserPointTransactions(
      userId,
      page,
      limit,
      type
    );
  }

  @Post(':userId/transactions')
  @ApiOperation({
    summary: '포인트 거래 생성',
    description: '새로운 포인트 거래를 생성합니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    example: 'user-uuid',
  })
  @ApiBody({
    description: '포인트 거래 정보',
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: '포인트 금액',
          example: 100,
        },
        type: {
          type: 'string',
          enum: ['EARNED', 'SPENT', 'REFUNDED', 'BONUS', 'EXPIRED'],
          description: '거래 타입',
          example: 'EARNED',
        },
        description: {
          type: 'string',
          description: '거래 설명',
          example: '포인트 적립',
        },
        referenceId: {
          type: 'string',
          description: '참조 ID (마권 ID 등)',
          example: 'bet-uuid',
        },
        referenceType: {
          type: 'string',
          description: '참조 타입',
          example: 'BET',
        },
      },
      required: ['amount', 'type', 'description'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '포인트 거래 생성 성공',
  })
  async createPointTransaction(
    @Param('userId') userId: string,
    @Body() createTransactionDto: any
  ) {
    return this.pointsService.addPoints(userId, createTransactionDto);
  }

  @Get(':userId/statistics')
  @ApiOperation({
    summary: '사용자 포인트 통계 조회',
    description: '특정 사용자의 포인트 통계를 조회합니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    example: 'user-uuid',
  })
  @ApiResponse({
    status: 200,
    description: '포인트 통계 조회 성공',
    schema: {
      type: 'object',
      properties: {
        totalTransactions: { type: 'number', example: 50 },
        totalEarned: { type: 'number', example: 5000 },
        totalSpent: { type: 'number', example: 4000 },
        currentBalance: { type: 'number', example: 1000 },
        averageTransaction: { type: 'number', example: 100 },
        lastTransactionDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getPointStatistics(@Param('userId') userId: string) {
    return this.pointsService.getUserPointStatistics(userId);
  }
}
