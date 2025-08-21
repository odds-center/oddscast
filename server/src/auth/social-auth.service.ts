import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { randomBytes, createHash } from 'crypto';

export interface GoogleOAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface GoogleUserInfo {
  socialId: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export interface TemporaryTokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  socialId: string;
  email: string;
  name: string;
  picture?: string;
  exist: boolean;
  createdAt: number;
  code: string;
}

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);
  private readonly temporaryTokenStorage: Map<string, TemporaryTokenInfo> =
    new Map();
  private readonly TOKEN_EXPIRE_TIME = 5 * 60 * 1000; // 5분

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    // 생성자에서 주기적으로 만료된 토큰을 정리하는 인터벌 설정
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60000); // 1분마다 실행
  }

  /**
   * 만료된 임시 토큰들을 정리합니다.
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.temporaryTokenStorage.entries()) {
      if (now - value.createdAt > this.TOKEN_EXPIRE_TIME) {
        this.temporaryTokenStorage.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(
        `만료된 토큰 ${cleanedCount}개 정리 완료. 현재 저장소 크기: ${this.temporaryTokenStorage.size}`
      );
    }
  }

  /**
   * PKCE용 code_verifier와 code_challenge를 생성합니다.
   */
  public generatePKCEPair(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  /**
   * Google OAuth 토큰을 가져옵니다.
   */
  private async getGoogleOAuthToken(params: {
    code: string;
    codeVerifier: string;
  }): Promise<GoogleOAuthToken> {
    const { code, codeVerifier } = params;

    try {
      this.logger.log('Google OAuth 토큰 요청 시작');

      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: this.configService.get('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
          redirect_uri: this.configService.get('GOOGLE_CALLBACK_URL'),
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!tokenResponse.data.access_token) {
        this.logger.error(
          'Google OAuth 응답에 access_token이 없습니다',
          tokenResponse.data
        );
        throw new Error('Google OAuth 응답에 access_token이 없습니다.');
      }

      this.logger.log('Google OAuth 토큰 획득 성공');

      return {
        access_token: tokenResponse.data.access_token,
        refresh_token: tokenResponse.data.refresh_token,
        expires_in: tokenResponse.data.expires_in,
      };
    } catch (error) {
      this.logger.error(
        'Google OAuth 토큰 요청 실패:',
        error.response?.data || error.message
      );

      if (error.response?.data?.error) {
        const errorMessage = `Google OAuth 에러: ${error.response.data.error} - ${error.response.data.error_description || ''}`;
        this.logger.error(errorMessage);
      }

      throw new UnauthorizedException(
        'Google OAuth 토큰을 가져올 수 없습니다.'
      );
    }
  }

  /**
   * Google 사용자 정보를 가져옵니다.
   */
  private async getGoogleUserInfo(
    accessToken: string
  ): Promise<GoogleUserInfo> {
    try {
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const {
        sub: socialId,
        email,
        name,
        picture,
        email_verified,
      } = userInfoResponse.data;

      if (!email_verified) {
        throw new UnauthorizedException(
          'Google 계정의 이메일이 확인되지 않았습니다.'
        );
      }

      return { socialId, email, name, picture, email_verified };
    } catch (error) {
      this.logger.error(
        'Google 사용자 정보 가져오기 실패:',
        error.response?.data || error.message
      );
      throw new UnauthorizedException(
        'Google 사용자 정보를 가져올 수 없습니다.'
      );
    }
  }

  /**
   * Google OAuth 코드를 검증하고 사용자 정보를 반환합니다.
   */
  public async verifyGoogleCode(params: {
    code: string;
    codeVerifier: string;
  }): Promise<{
    email: string;
    name: string;
    exist: boolean;
    socialId: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    this.cleanupExpiredTokens();
    const { code, codeVerifier } = params;

    try {
      // 1. Google OAuth 토큰 얻기
      const { access_token, refresh_token, expires_in } =
        await this.getGoogleOAuthToken({
          code,
          codeVerifier,
        });

      // 2. Google 사용자 정보 가져오기
      const {
        socialId,
        email: googleEmail,
        name,
        picture,
      } = await this.getGoogleUserInfo(access_token);

      // 3. 기존 사용자 확인
      const existingUser = await this.usersService.findByGoogleId(socialId);
      const existingUserByEmail =
        await this.usersService.findByEmail(googleEmail);

      // 4. 임시 토큰 정보 저장
      const storageKey = `google_auth:${socialId}`;
      this.temporaryTokenStorage.set(storageKey, {
        access_token,
        refresh_token,
        expires_in,
        socialId,
        email: googleEmail,
        name,
        picture,
        exist: !!existingUser || !!existingUserByEmail,
        createdAt: Date.now(),
        code,
      });

      this.logger.log(`Google OAuth 코드 검증 완료: ${googleEmail}`);

      return {
        email: googleEmail,
        name,
        exist: !!existingUser || !!existingUserByEmail,
        socialId,
        access_token,
        refresh_token,
        expires_in,
      };
    } catch (error) {
      this.logger.error('Google 코드 검증 실패:', error.message);
      throw error;
    }
  }

  /**
   * Google ID 토큰을 검증합니다.
   */
  public async verifyGoogleIdToken(idToken: string): Promise<{
    socialEmail: string;
    socialName: string;
    exist: boolean;
    socialId: string;
  }> {
    try {
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );
      const { sub: socialId, email, name, email_verified } = response.data;

      if (!email_verified) {
        throw new UnauthorizedException(
          'Google 계정의 이메일이 확인되지 않았습니다.'
        );
      }

      // 기존 사용자 확인
      const existingUser = await this.usersService.findByGoogleId(socialId);
      const existingUserByEmail = await this.usersService.findByEmail(email);

      return {
        socialEmail: email,
        socialName: name,
        exist: !!existingUser || !!existingUserByEmail,
        socialId,
      };
    } catch (error) {
      this.logger.error(
        'Google ID 토큰 검증 실패:',
        error.response?.data || error.message
      );
      throw new UnauthorizedException('유효하지 않은 Google ID 토큰입니다.');
    }
  }

  /**
   * Google 로그인을 처리합니다.
   */
  public async googleSignin(params: {
    socialId: string;
    socialEmail: string;
    phoneNumber?: string;
    referralCode?: string;
    companyName?: string;
  }): Promise<{
    jwt: string;
    userId: string;
    isFirst: boolean;
    user: any;
  }> {
    this.cleanupExpiredTokens();

    const { socialId, socialEmail, phoneNumber, referralCode, companyName } =
      params;
    const storageKey = `google_auth:${socialId}`;

    try {
      const storedTokenInfo = this.temporaryTokenStorage.get(storageKey);
      if (!storedTokenInfo) {
        throw new UnauthorizedException(
          '유효하지 않은 인증 세션입니다. 다시 로그인해주세요.'
        );
      }

      const { access_token, refresh_token, expires_in, name, picture } =
        storedTokenInfo;

      // 기존 사용자 확인
      let user = await this.usersService.findByGoogleId(socialId);

      if (user) {
        // 기존 사용자: 토큰 정보 업데이트
        await this.usersService.update(user.id, {
          refreshToken: refresh_token,
        });

        const jwt = await this.generateJWT(user.id);

        // 사용한 토큰 정보 삭제
        this.temporaryTokenStorage.delete(storageKey);

        this.logger.log(`기존 사용자 로그인 성공: ${user.email}`);

        return {
          jwt,
          userId: user.id,
          isFirst: false,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
        };
      }

      // 새 사용자 생성
      const createUserDto = {
        email: socialEmail,
        name: name || '',
        avatar: picture || '',
        providerId: socialId,
        authProvider: 'google',
      };

      user = await this.usersService.create(createUserDto);
      const jwt = await this.generateJWT(user.id);

      // 사용한 토큰 정보 삭제
      this.temporaryTokenStorage.delete(storageKey);

      this.logger.log(`새 사용자 생성 및 로그인 성공: ${user.email}`);

      return {
        jwt,
        userId: user.id,
        isFirst: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      this.logger.error('Google 로그인 실패:', error.message);
      throw error;
    }
  }

  /**
   * JWT 토큰을 생성합니다.
   */
  private async generateJWT(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      providerId: user.providerId,
      name: user.name,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
    });
  }

  /**
   * 구글 액세스 토큰을 무효화합니다.
   */
  public async revokeGoogleAccess(accessToken: string): Promise<void> {
    try {
      await axios.post('https://oauth2.googleapis.com/revoke', {
        token: accessToken,
      });

      this.logger.log('구글 액세스 토큰 무효화 성공');
    } catch (error) {
      this.logger.error('구글 액세스 토큰 무효화 실패:', error.message);
      // 무효화 실패는 로그만 남기고 에러를 던지지 않음
    }
  }
}
