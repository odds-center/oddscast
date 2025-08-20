import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Get('google')
  @ApiOperation({ summary: '구글 OAuth 로그인 시작' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // 구글 OAuth 페이지로 리다이렉트
  }

  @Get('google/callback')
  @ApiOperation({ summary: '구글 OAuth 콜백 처리' })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req.user);

    // 프론트엔드로 리다이렉트 (토큰 포함)
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${result.access_token}`;
    res.redirect(redirectUrl);
  }

  @Post('google/login')
  @ApiOperation({ summary: '구글 ID 토큰으로 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  async googleTokenLogin(@Body() body: { idToken: string }) {
    try {
      // 구글 ID 토큰 검증 및 사용자 정보 추출
      // 실제 구현에서는 구글 API를 통해 토큰 검증 필요
      // 현재는 테스트용 더미 데이터 사용
      const googleUser = {
        sub: `google_${Date.now()}`, // 고유한 Google ID 생성
        email: 'test@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: '',
        locale: 'ko',
      };

      console.log('Processing Google login for user:', googleUser.email);

      const result = await this.authService.googleLogin(googleUser);
      console.log('Google login successful for user:', googleUser.email);

      return result;
    } catch (error) {
      console.error('Google token login failed:', error);
      // 더 자세한 오류 정보 로깅
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout() {
    // 클라이언트에서 토큰 제거
    return { message: '로그아웃되었습니다.' };
  }
}
