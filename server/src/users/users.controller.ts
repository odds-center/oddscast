import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../database/db-enums';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '사용자 목록 조회' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll({ page, limit, role });
  }

  @Get('search')
  @ApiOperation({ summary: '사용자 검색' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  search(@Query('q') query: string) {
    return this.usersService.findAll({ search: query });
  }

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(user.sub);
  }

  @Get('me/stats')
  @ApiOperation({ summary: '내 통계 조회' })
  getMyStats(@CurrentUser() user: JwtPayload) {
    return this.usersService.getStats(user.sub);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: '사용자 프로필 조회' })
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id/profile')
  @ApiOperation({ summary: '사용자 프로필 수정' })
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.sub !== id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('본인의 프로필만 수정할 수 있습니다.');
    }
    return this.usersService.update(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '사용자 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '사용자 통계 조회' })
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getStats(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: '사용자 통계 조회 (alias)' })
  getStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getStats(id);
  }

  @Get(':id/achievements')
  @ApiOperation({ summary: '사용자 업적 조회' })
  getAchievements(@Param('id') _id: string) {
    // 임시 구현: 실제 서비스 메서드 필요. 일단 빈 배열 반환
    return [];
  }

  @Get(':id/activities')
  @ApiOperation({ summary: '사용자 활동 내역 조회' })
  getActivities(@Param('id') _id: string) {
    return { activities: [], total: 0, page: 1, totalPages: 1 };
  }

  @Get(':id/notifications')
  @ApiOperation({ summary: '사용자 알림 조회' })
  getNotifications(@Param('id') _id: string) {
    return { notifications: [], total: 0, page: 1, totalPages: 1 };
  }

  @Get(':id/preferences')
  @ApiOperation({ summary: '사용자 설정 조회' })
  getPreferences(@Param('id') _id: string) {
    return { marketing: true, notifications: true };
  }

  @Put(':id/preferences')
  @ApiOperation({ summary: '사용자 설정 수정' })
  updatePreferences(
    @Param('id') _id: string,
    @Body() _body: Record<string, unknown>,
  ) {
    return { marketing: true, notifications: true };
  }

  @Put(':id')
  @ApiOperation({ summary: '사용자 정보 수정' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '사용자 비활성화' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
