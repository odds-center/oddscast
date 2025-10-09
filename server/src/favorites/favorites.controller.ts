import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoritePriority, FavoriteType } from './entities/favorite.entity';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: '즐겨찾기 추가' })
  @ApiResponse({
    status: 201,
    description: '즐겨찾기가 성공적으로 추가되었습니다.',
  })
  @ApiResponse({
    status: 409,
    description: '이미 즐겨찾기에 추가된 항목입니다.',
  })
  async create(@Request() req, @Body() createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.create(req.user.userId, createFavoriteDto);
  }

  @Get()
  @ApiOperation({ summary: '즐겨찾기 목록 조회' })
  @ApiQuery({ name: 'type', enum: FavoriteType, required: false })
  @ApiQuery({ name: 'priority', enum: FavoritePriority, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 목록을 성공적으로 조회했습니다.',
  })
  async findAll(
    @Request() req,
    @Query('type') type?: FavoriteType,
    @Query('priority') priority?: FavoritePriority,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.favoritesService.findAll(req.user.userId, {
      type,
      priority,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: '즐겨찾기 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 통계를 성공적으로 조회했습니다.',
  })
  async getStatistics(@Request() req) {
    return this.favoritesService.getStatistics(req.user.userId);
  }

  @Get('check/:type/:targetId')
  @ApiOperation({ summary: '즐겨찾기 여부 확인' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기 여부를 성공적으로 확인했습니다.',
  })
  async checkFavorite(
    @Request() req,
    @Param('type') type: FavoriteType,
    @Param('targetId') targetId: string
  ) {
    const isFavorite = await this.favoritesService.checkFavorite(
      req.user.userId,
      type,
      targetId
    );
    return { isFavorite };
  }

  @Get(':id')
  @ApiOperation({ summary: '개별 즐겨찾기 조회' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기를 성공적으로 조회했습니다.',
  })
  @ApiResponse({ status: 404, description: '즐겨찾기를 찾을 수 없습니다.' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.favoritesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '즐겨찾기 수정' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기가 성공적으로 수정되었습니다.',
  })
  @ApiResponse({ status: 404, description: '즐겨찾기를 찾을 수 없습니다.' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFavoriteDto: UpdateFavoriteDto
  ) {
    return this.favoritesService.update(req.user.userId, id, updateFavoriteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '즐겨찾기 삭제' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기가 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({ status: 404, description: '즐겨찾기를 찾을 수 없습니다.' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.favoritesService.remove(req.user.userId, id);
    return { message: '즐겨찾기가 삭제되었습니다.' };
  }

  @Delete()
  @ApiOperation({ summary: '즐겨찾기 일괄 삭제' })
  @ApiResponse({
    status: 200,
    description: '즐겨찾기가 성공적으로 삭제되었습니다.',
  })
  async bulkDelete(@Request() req, @Body('favoriteIds') favoriteIds: string[]) {
    return this.favoritesService.bulkDelete(req.user.userId, favoriteIds);
  }
}
