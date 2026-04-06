import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { KakaoAuthGuard } from './guards/kakao-auth.guard';
import {
  RegisterDto,
  LoginDto,
  AdminLoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  DeleteAccountDto,
} from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: '로그인 (이메일/비밀번호)' })
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('admin/login')
  @ApiOperation({ summary: '관리자 로그인 (아이디/비밀번호)' })
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.loginId, dto.password);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '로그아웃' })
  logout(@CurrentUser() _user: JwtPayload) {
    return { message: '로그아웃 성공' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 정보 조회' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub, user.role);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '프로필 조회' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub, user.role);
  }

  @Put('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '프로필 수정' })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, dto);
  }

  @Put('password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '비밀번호 변경' })
  updatePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.sub,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '비밀번호 변경 (legacy)' })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.sub,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  @Post('forgot-password')
  @ApiOperation({ summary: '비밀번호 찾기' })
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: '비밀번호 재설정' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  @ApiOperation({ summary: '이메일 인증' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: '인증 메일 재발송' })
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Delete('account')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '계정 삭제 (비밀번호 확인)' })
  deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(user.sub, dto.password);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '토큰 갱신' })
  refreshToken(@CurrentUser() user: JwtPayload) {
    return this.authService.refreshToken(user.sub, user.role);
  }

  @Get('check')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '인증 상태 확인' })
  checkAuth(@CurrentUser() user: JwtPayload) {
    return { authenticated: true, userId: user.sub };
  }

  // ── Kakao OAuth ──────────────────────────────────────────────────────────

  @Get('kakao')
  @ApiOperation({ summary: 'Start Kakao OAuth login' })
  @UseGuards(KakaoAuthGuard)
  kakaoLogin() {
    // Passport redirects the browser to Kakao — this handler is never reached
  }

  @Get('kakao/callback')
  @ApiOperation({ summary: 'Kakao OAuth callback' })
  @UseGuards(KakaoAuthGuard)
  async kakaoCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user;
    const { accessToken, refreshToken } = this.authService.generateTokens(user);
    const webappUrl = this.authService.getWebappUrl();

    const params = new URLSearchParams({
      token: accessToken,
      refreshToken: refreshToken ?? '',
    });
    res.redirect(`${webappUrl}/auth/kakao/success?${params.toString()}`);
  }
}
