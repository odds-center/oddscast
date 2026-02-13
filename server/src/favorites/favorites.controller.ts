import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import {
  CreateFavoriteDto,
  UpdateFavoriteDto,
  ToggleFavoriteDto,
} from './dto/favorite.dto';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: '즐겨찾기 목록 조회' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.favoritesService.findAll(user.sub, { type, page, limit });
  }

  @Get('statistics')
  @ApiOperation({ summary: '즐겨찾기 통계' })
  getStatistics(@CurrentUser() user: JwtPayload) {
    return this.favoritesService.getStatistics(user.sub);
  }

  @Get('check')
  @ApiOperation({ summary: '즐겨찾기 확인' })
  check(
    @CurrentUser() user: JwtPayload,
    @Query('type') type: string,
    @Query('targetId') targetId: string,
  ) {
    return this.favoritesService.check(user.sub, type || 'RACE', targetId);
  }

  @Get('search')
  @ApiOperation({ summary: '즐겨찾기 검색' })
  search(@CurrentUser() user: JwtPayload, @Query('query') query: string) {
    return this.favoritesService.search(user.sub, query);
  }

  @Get('export')
  @ApiOperation({ summary: '즐겨찾기 내보내기' })
  export(@CurrentUser() user: JwtPayload) {
    return this.favoritesService.export(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: '즐겨찾기 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.favoritesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '즐겨찾기 생성' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(user.sub, dto);
  }

  @Post('toggle')
  @ApiOperation({ summary: '즐겨찾기 토글' })
  toggle(@CurrentUser() user: JwtPayload, @Body() dto: ToggleFavoriteDto) {
    return this.favoritesService.toggle(user.sub, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: '즐겨찾기 일괄 추가' })
  bulkAdd(@CurrentUser() user: JwtPayload, @Body() items: CreateFavoriteDto[]) {
    return this.favoritesService.bulkAdd(user.sub, items);
  }

  @Delete('bulk')
  @ApiOperation({ summary: '즐겨찾기 일괄 삭제' })
  bulkDelete(@CurrentUser() user: JwtPayload, @Body() body: { ids: string[] }) {
    return this.favoritesService.bulkDelete(user.sub, body.ids);
  }

  @Put(':id')
  @ApiOperation({ summary: '즐겨찾기 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateFavoriteDto) {
    return this.favoritesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '즐겨찾기 삭제' })
  remove(@Param('id') id: string) {
    return this.favoritesService.remove(id);
  }
}
