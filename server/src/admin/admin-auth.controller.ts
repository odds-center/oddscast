import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AdminLoginDto } from '../auth/dto/auth.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/db-enums';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';

/**
 * Admin 전용 Auth API — /api/admin/auth/*
 * Admin 클라이언트 baseURL이 /api/admin 이므로 경로: /auth/login, /auth/me, /auth/refresh
 */
@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '[Admin] 로그인 (아이디/비밀번호)' })
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  login(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.loginId, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] 내 정보 조회' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub, user.role);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] 토큰 갱신' })
  refreshToken(@CurrentUser() user: JwtPayload) {
    return this.authService.refreshToken(user.sub, user.role);
  }
}
