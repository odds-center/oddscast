import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private usersService: UsersService
  ) {}

  @Get('google/authorize')
  @ApiOperation({ summary: 'Google OAuth 인증 URL 생성 (PKCE 지원)' })
  @ApiQuery({
    name: 'state',
    description: '상태값 (선택사항)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Google OAuth 인증 URL과 PKCE 정보',
    schema: {
      type: 'object',
      properties: {
        authUrl: { type: 'string', description: 'Google OAuth 인증 URL' },
        codeVerifier: { type: 'string', description: 'PKCE code_verifier' },
        state: { type: 'string', description: '상태값' },
      },
    },
  })
  async generateGoogleAuthUrl(@Query('state') state?: string) {
    try {
      const { codeVerifier, codeChallenge } =
        this.socialAuthService.generatePKCEPair();
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_CALLBACK_URL;

      if (!clientId || !redirectUri) {
        throw new HttpException(
          'Google OAuth 설정이 누락되었습니다.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'email profile');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      if (state) {
        authUrl.searchParams.set('state', state);
      }

      // codeVerifier를 세션이나 쿠키에 저장해야 합니다 (프론트엔드에서 관리)
      return {
        authUrl: authUrl.toString(),
        codeVerifier,
        state: state || 'default',
      };
    } catch (error) {
      this.logger.error(`Google OAuth URL 생성 실패: ${error.message}`);
      throw new HttpException(
        '인증 URL을 생성할 수 없습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('google/verify-code')
  @ApiOperation({ summary: 'Google OAuth 코드 검증 (PKCE 지원)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Google OAuth 인증 코드',
          example: '4/0AfJohXn...',
        },
        codeVerifier: {
          type: 'string',
          description: 'PKCE code_verifier',
          example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        },
      },
      required: ['code', 'codeVerifier'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '코드 검증 성공',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        exist: { type: 'boolean' },
        socialId: { type: 'string' },
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
        expires_in: { type: 'number' },
      },
    },
  })
  async verifyGoogleCode(@Body() body: { code: string; codeVerifier: string }) {
    try {
      if (!body.code || !body.codeVerifier) {
        throw new HttpException(
          '인증 코드와 code_verifier가 필요합니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log('Google OAuth 코드 검증 시도');

      const result = await this.socialAuthService.verifyGoogleCode({
        code: body.code,
        codeVerifier: body.codeVerifier,
      });

      this.logger.log('Google OAuth 코드 검증 성공');

      return result;
    } catch (error) {
      this.logger.error(`Google OAuth 코드 검증 실패: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '코드 검증에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('google/signin')
  @ApiOperation({ summary: 'Google 로그인 완료' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        socialId: {
          type: 'string',
          description: 'Google 사용자 ID',
          example: '123456789',
        },
        socialEmail: {
          type: 'string',
          description: 'Google 이메일',
          example: 'user@example.com',
        },
        phoneNumber: {
          type: 'string',
          description: '전화번호 (선택사항)',
          example: '010-1234-5678',
        },
        referralCode: {
          type: 'string',
          description: '추천인 코드 (선택사항)',
          example: 'REF123',
        },
        companyName: {
          type: 'string',
          description: '회사명 (선택사항)',
          example: 'Golden Race',
        },
      },
      required: ['socialId', 'socialEmail'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      type: 'object',
      properties: {
        jwt: { type: 'string' },
        userId: { type: 'string' },
        isFirst: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            avatar: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            locale: { type: 'string' },
          },
        },
      },
    },
  })
  async googleSignin(
    @Body()
    body: {
      socialId: string;
      socialEmail: string;
      phoneNumber?: string;
      referralCode?: string;
      companyName?: string;
    }
  ) {
    try {
      if (!body.socialId || !body.socialEmail) {
        throw new HttpException(
          '소셜 ID와 이메일이 필요합니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log('Google 로그인 시도');

      const result = await this.socialAuthService.googleSignin(body);

      this.logger.log('Google 로그인 성공');

      return result;
    } catch (error) {
      this.logger.error(`Google 로그인 실패: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '로그인에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('google/verify-id-token')
  @ApiOperation({ summary: 'Google ID 토큰 검증' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idToken: {
          type: 'string',
          description: 'Google ID 토큰',
          example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...',
        },
      },
      required: ['idToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '토큰 검증 성공',
    schema: {
      type: 'object',
      properties: {
        socialEmail: { type: 'string' },
        socialName: { type: 'string' },
        exist: { type: 'boolean' },
        socialId: { type: 'string' },
      },
    },
  })
  async verifyGoogleIdToken(@Body() body: { idToken: string }) {
    try {
      if (!body.idToken) {
        throw new HttpException(
          'ID 토큰이 필요합니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log('Google ID 토큰 검증 시도');

      const result = await this.socialAuthService.verifyGoogleIdToken(
        body.idToken
      );

      this.logger.log('Google ID 토큰 검증 성공');

      return result;
    } catch (error) {
      this.logger.error(`Google ID 토큰 검증 실패: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '토큰 검증에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('google/revoke')
  @ApiOperation({ summary: '구글 액세스 토큰 무효화' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: '무효화할 구글 액세스 토큰',
          example: 'ya29.a0AfH6SMC...',
        },
      },
      required: ['accessToken'],
    },
  })
  @ApiResponse({ status: 200, description: '토큰 무효화 성공' })
  async revokeGoogleAccess(@Body() body: { accessToken: string }) {
    try {
      if (!body.accessToken) {
        throw new HttpException(
          '액세스 토큰이 필요합니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log('구글 액세스 토큰 무효화 시도');
      await this.socialAuthService.revokeGoogleAccess(body.accessToken);

      return { message: '구글 액세스 토큰이 무효화되었습니다.' };
    } catch (error) {
      this.logger.error(`구글 액세스 토큰 무효화 실패: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '토큰 무효화에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 기존 OAuth 플로우 지원 (하위 호환성)
  @Get('google')
  @ApiOperation({ summary: '구글 OAuth 로그인 시작 (기존 방식)' })
  @ApiResponse({ status: 200, description: '구글 OAuth 페이지로 리다이렉트' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // 구글 OAuth 페이지로 리다이렉트
    // Passport Strategy가 자동으로 처리
  }

  @Get('google/callback')
  @ApiOperation({ summary: '구글 OAuth 콜백 처리 (기존 방식)' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공 및 프론트엔드 리다이렉트',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      this.logger.log('구글 OAuth 콜백 처리 시작 (기존 방식)');

      if (!req.user) {
        throw new HttpException(
          '사용자 정보를 가져올 수 없습니다.',
          HttpStatus.UNAUTHORIZED
        );
      }

      const result = await this.authService.googleLogin(req.user);

      // 프론트엔드로 리다이렉트 (토큰 포함)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}`;

      this.logger.log(`프론트엔드 리다이렉트: ${frontendUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`구글 OAuth 콜백 처리 실패: ${error.message}`);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`;
      res.redirect(errorUrl);
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: '갱신할 리프레시 토큰',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 토큰' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    try {
      if (!body.refreshToken) {
        throw new HttpException(
          '리프레시 토큰이 필요합니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log('토큰 갱신 시도');
      const result = await this.authService.refreshToken(body.refreshToken);
      this.logger.log('토큰 갱신 성공');

      return result;
    } catch (error) {
      this.logger.error(`토큰 갱신 실패: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '토큰 갱신에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: '로그아웃할 사용자 ID',
          example: 'user-123',
        },
        accessToken: {
          type: 'string',
          description: '무효화할 구글 액세스 토큰 (선택사항)',
          example: 'ya29.a0AfH6SMC...',
        },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Body() body: { userId: string; accessToken?: string }) {
    try {
      if (!body.userId) {
        throw new HttpException(
          '사용자 ID가 필요합니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`사용자 로그아웃 시도: ${body.userId}`);

      // 구글 액세스 토큰이 있으면 무효화
      if (body.accessToken) {
        await this.socialAuthService.revokeGoogleAccess(body.accessToken);
      }

      const result = await this.authService.logout(body.userId);
      this.logger.log(`사용자 로그아웃 성공: ${body.userId}`);

      return result;
    } catch (error) {
      this.logger.error(`로그아웃 실패: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '로그아웃에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
