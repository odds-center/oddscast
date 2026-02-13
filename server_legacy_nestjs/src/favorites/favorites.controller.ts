import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoritesService } from './favorites.service';
import {
  CreateFavoriteDto,
  UpdateFavoriteDto,
  FavoriteResponseDto,
  FavoriteListResponseDto,
  FavoriteToggleDto,
  FavoriteCheckDto,
  FavoriteStatisticsDto,
  BulkAddFavoritesDto,
  BulkDeleteFavoritesDto,
} from './dto/index';

/**
 * 즐겨찾기 API 컨트롤러
 */
@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: '즐겨찾기 목록 조회' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '즐겨찾기 타입 (HORSE, JOCKEY, TRAINER)',
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
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 목록 반환',
    type: FavoriteListResponseDto,
  })
  async getFavorites(
    @Request() req,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<FavoriteListResponseDto> {
    const userId = req.user.userId;
    return await this.favoritesService.getFavorites(userId, {
      type,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '즐겨찾기 상세 조회' })
  @ApiParam({ name: 'id', description: '즐겨찾기 ID' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 상세 정보 반환',
    type: FavoriteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '즐겨찾기를 찾을 수 없음',
  })
  async getFavorite(
    @Request() req,
    @Param('id') id: string
  ): Promise<FavoriteResponseDto> {
    const userId = req.user.userId;
    return await this.favoritesService.getFavorite(userId, id);
  }

  @Post()
  @ApiOperation({ summary: '즐겨찾기 추가' })
  @ApiBody({ type: CreateFavoriteDto })
  @ApiResponse({
    status: 201,
    description: '즐겨찾기 생성 성공',
    type: FavoriteResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이미 즐겨찾기에 추가된 항목',
  })
  async createFavorite(
    @Request() req,
    @Body() createFavoriteDto: CreateFavoriteDto
  ): Promise<FavoriteResponseDto> {
    const userId = req.user.userId;
    return await this.favoritesService.createFavorite(
      userId,
      createFavoriteDto
    );
  }

  @Put(':id')
  @ApiOperation({ summary: '즐겨찾기 수정' })
  @ApiParam({ name: 'id', description: '즐겨찾기 ID' })
  @ApiBody({ type: UpdateFavoriteDto })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 수정 성공',
    type: FavoriteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '즐겨찾기를 찾을 수 없음',
  })
  async updateFavorite(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFavoriteDto: UpdateFavoriteDto
  ): Promise<FavoriteResponseDto> {
    const userId = req.user.userId;
    return await this.favoritesService.updateFavorite(
      userId,
      id,
      updateFavoriteDto
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '즐겨찾기 삭제' })
  @ApiParam({ name: 'id', description: '즐겨찾기 ID' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 삭제 성공',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @ApiResponse({
    status: 404,
    description: '즐겨찾기를 찾을 수 없음',
  })
  async deleteFavorite(
    @Request() req,
    @Param('id') id: string
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    return await this.favoritesService.deleteFavorite(userId, id);
  }

  @Post('toggle')
  @ApiOperation({ summary: '즐겨찾기 토글 (추가/삭제)' })
  @ApiBody({ type: FavoriteToggleDto })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 토글 성공',
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['ADDED', 'REMOVED'] },
        favorite: { $ref: '#/components/schemas/FavoriteResponseDto' },
      },
    },
  })
  async toggleFavorite(
    @Request() req,
    @Body() toggleDto: FavoriteToggleDto
  ): Promise<{ action: 'ADDED' | 'REMOVED'; favorite?: FavoriteResponseDto }> {
    const userId = req.user.userId;
    return await this.favoritesService.toggleFavorite(userId, toggleDto);
  }

  @Get('check')
  @ApiOperation({ summary: '즐겨찾기 확인' })
  @ApiQuery({ name: 'type', description: '즐겨찾기 타입', example: 'HORSE' })
  @ApiQuery({ name: 'targetId', description: '대상 ID', example: 'horse-123' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 확인 결과',
    type: FavoriteCheckDto,
  })
  async checkFavorite(
    @Request() req,
    @Query('type') type: string,
    @Query('targetId') targetId: string
  ): Promise<FavoriteCheckDto> {
    const userId = req.user.userId;
    return await this.favoritesService.checkFavorite(userId, type, targetId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '즐겨찾기 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 통계 반환',
    type: FavoriteStatisticsDto,
  })
  async getFavoriteStatistics(@Request() req): Promise<FavoriteStatisticsDto> {
    const userId = req.user.userId;
    return await this.favoritesService.getFavoriteStatistics(userId);
  }

  @Post('bulk-add')
  @ApiOperation({ summary: '즐겨찾기 일괄 추가' })
  @ApiBody({ type: BulkAddFavoritesDto })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 일괄 추가 결과',
    schema: {
      type: 'object',
      properties: {
        added: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkAddFavorites(
    @Request() req,
    @Body() bulkAddDto: BulkAddFavoritesDto
  ): Promise<{
    added: number;
    failed: number;
    errors: { index: number; error: string }[];
  }> {
    const userId = req.user.userId;
    return await this.favoritesService.bulkAddFavorites(
      userId,
      bulkAddDto.favorites
    );
  }

  @Delete('bulk-delete')
  @ApiOperation({ summary: '즐겨찾기 일괄 삭제' })
  @ApiBody({ type: BulkDeleteFavoritesDto })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 일괄 삭제 결과',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              favoriteId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkDeleteFavorites(
    @Request() req,
    @Body() bulkDeleteDto: BulkDeleteFavoritesDto
  ): Promise<{
    deleted: number;
    failed: number;
    errors: { favoriteId: string; error: string }[];
  }> {
    const userId = req.user.userId;
    return await this.favoritesService.bulkDeleteFavorites(
      userId,
      bulkDeleteDto.favoriteIds
    );
  }
}
