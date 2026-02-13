import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UsersService } from '../users/users.service';
import { JwtService } from './jwt.service';

interface GoogleOAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface GoogleUserInfo {
  socialId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);
  private readonly temporaryTokenStorage: Map<
    string,
    {
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
  > = new Map();

  private readonly TOKEN_EXPIRE_TIME = 5 * 60 * 1000; // 5분

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {
    // 주기적으로 만료된 토큰을 정리하는 인터벌 설정
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60000); // 1분마다 실행
  }

  /**
   * 만료된 토큰들을 정리합니다.
   */
  private cleanupExpiredTokens() {
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
        `Cleaned up ${cleanedCount} expired tokens. Current storage size: ${this.temporaryTokenStorage.size}`
      );
    }
  }

  /**
   * PKCE 코드 쌍을 생성합니다.
   */
  public generatePKCEPair(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = this.generateRandomString(128);
    // 임시로 codeVerifier를 그대로 사용 (실제로는 SHA-256 해시 사용)
    const codeChallenge = codeVerifier;

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

      const { sub: socialId, email, name, picture } = userInfoResponse.data;

      return {
        socialId,
        email,
        name,
        picture,
      };
    } catch (error) {
      this.logger.error(
        'Google 사용자 정보 요청 실패:',
        error.response?.data || error.message
      );
      throw new UnauthorizedException(
        'Google 사용자 정보를 가져올 수 없습니다.'
      );
    }
  }

  /**
   * Google OAuth 코드를 검증합니다.
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
      this.logger.log('Google ID 토큰 검증 시작');

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

      this.logger.log(`Google ID 토큰 검증 완료: ${email}`);

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
   * Google ID 토큰으로 로그인을 처리합니다.
   */
  public async googleSigninWithIdToken(params: {
    socialId: string;
    socialEmail: string;
    socialName: string;
    idToken?: string; // ID Token을 선택사항으로 변경
    accessToken?: string; // Google Access Token 추가
    refreshToken?: string; // Google Refresh Token 추가
    tokenExpiresAt?: Date; // 토큰 만료 시간 추가
  }): Promise<{
    jwt: string;
    userId: string;
    isFirst: boolean;
    user: any;
  }> {
    try {
      const {
        socialId,
        socialEmail,
        socialName,
        idToken,
        accessToken,
        refreshToken,
        tokenExpiresAt,
      } = params;

      // 기존 사용자 확인 (Google ID 또는 이메일로)
      let user = await this.usersService.findByGoogleId(socialId);

      // Google ID로 못 찾았으면 이메일로 찾기
      if (!user) {
        user = await this.usersService.findByEmail(socialEmail);

        // 이메일로 찾았으면 Google ID를 업데이트
        if (user) {
          this.logger.log(
            `기존 사용자 발견 (이메일): ${user.email}, Google ID 업데이트`
          );

          // providerId 업데이트
          await this.usersService.update(user.id, {
            providerId: socialId,
            authProvider: 'google',
          });
        }
      }

      if (user) {
        // 기존 사용자: Google OAuth 정보 업데이트
        await this.usersService.saveOrUpdateSocialAuth({
          userId: user.id,
          provider: 'google',
          providerId: socialId,
          email: socialEmail,
          name: socialName,
          accessToken,
          refreshToken,
          idToken,
          tokenExpiresAt,
        });

        // 로그인 시간 업데이트
        await this.usersService.update(user.id, {
          lastLogin: new Date(),
        });

        const jwt = await this.generateJWT(user.id);

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
      this.logger.log(`새 사용자 생성 시작: ${socialEmail}`);

      const createUserDto = {
        email: socialEmail,
        name: socialName || '',
        avatar: '',
        providerId: socialId, // Google Provider ID
        authProvider: 'google',
        isVerified: true, // Google에서 이미 검증됨
        isActive: true,
      };

      user = await this.usersService.create(createUserDto);

      // Google OAuth 정보 저장
      await this.usersService.saveOrUpdateSocialAuth({
        userId: user.id,
        provider: 'google',
        providerId: socialId,
        email: socialEmail,
        name: socialName,
        accessToken,
        refreshToken,
        idToken,
        tokenExpiresAt,
      });

      const jwt = await this.generateJWT(user.id);

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
      this.logger.error('Google ID Token 로그인 실패:', error.message);
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

    return this.jwtService.generateAccessToken(user);
  }

  /**
   * Google 액세스 토큰을 무효화합니다.
   */
  public async revokeGoogleAccess(accessToken: string): Promise<void> {
    try {
      await axios.post(
        'https://oauth2.googleapis.com/revoke',
        new URLSearchParams({
          token: accessToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.log('Google 액세스 토큰 무효화 성공');
    } catch (error) {
      this.logger.error(
        'Google 액세스 토큰 무효화 실패:',
        error.response?.data || error.message
      );
      throw new UnauthorizedException(
        'Google 액세스 토큰을 무효화할 수 없습니다.'
      );
    }
  }

  /**
   * 랜덤 문자열을 생성합니다.
   */
  private generateRandomString(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * SHA-256 해시를 생성합니다.
   */
  private async sha256(str: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return crypto.subtle.digest('SHA-256', data);
  }

  /**
   * Base64URL 인코딩을 수행합니다.
   */
  private base64URLEncode(buffer: ArrayBuffer): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}
