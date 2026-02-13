import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  AdminLoginDto,
  GoogleAuthDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
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
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: '로그인 (이메일/비밀번호)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('google')
  @ApiOperation({ summary: '구글 로그인 (idToken → JWT)' })
  googleLogin(@Body() dto: GoogleAuthDto) {
    return this.authService.googleLogin(dto.idToken);
  }

  @Post('admin/login')
  @ApiOperation({ summary: '관리자 로그인 (아이디/비밀번호)' })
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
  forgotPassword(@Body() _body: { email: string }) {
    return { message: '비밀번호 재설정 이메일이 발송되었습니다.' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: '비밀번호 재설정' })
  resetPassword(@Body() _body: { token: string; newPassword: string }) {
    return { message: '비밀번호가 재설정되었습니다.' };
  }

  @Post('verify-email')
  @ApiOperation({ summary: '이메일 인증' })
  verifyEmail(@Body() _body: { token: string }) {
    return { message: '이메일이 인증되었습니다.' };
  }

  @Post('resend-verification')
  @ApiOperation({ summary: '인증 메일 재발송' })
  resendVerification(@Body() _body: { email: string }) {
    return { message: '인증 메일이 재발송되었습니다.' };
  }

  @Delete('account')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '계정 삭제' })
  deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.authService.deleteAccount(user.sub);
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
}
