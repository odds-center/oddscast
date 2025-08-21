import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleTokenService } from './google-token.service';
import { JwtService } from './jwt.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly googleTokenService: GoogleTokenService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 사용자 로그인 (JWT 토큰 발급)
   */
  async login(user: any) {
    try {
      this.logger.log(`사용자 로그인: ${user.email}`);

      // JWT 토큰 생성
      const accessToken = this.jwtService.generateAccessToken(user);

      return {
        access_token: accessToken,
        expires_in: 3600, // 1시간 (실제로는 30일)
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      this.logger.error(`로그인 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * Google OAuth 로그인
   */
  async googleLogin(googleUser: any) {
    try {
      this.logger.log('구글 OAuth 로그인 시도');

      // 사용자 찾기 또는 생성
      const user = await this.usersService.findOrCreateByGoogle(googleUser);

      this.logger.log(`구글 로그인 성공: ${user.email}`);

      // JWT 토큰 생성
      return this.login(user);
    } catch (error) {
      this.logger.error(`구글 로그인 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * Google ID Token으로 로그인
   */
  async googleTokenLogin(idToken: string) {
    try {
      this.logger.log('구글 ID 토큰으로 로그인 시도');

      // 구글 ID 토큰 검증
      const googleUser = await this.googleTokenService.verifyIdToken(idToken);

      this.logger.log(`토큰 검증 성공: ${googleUser.email}`);

      // 사용자 찾기 또는 생성
      const user = await this.usersService.findOrCreateByGoogle(googleUser);

      this.logger.log(`사용자 로그인 성공: ${user.email}`);

      // JWT 토큰 생성
      return this.login(user);
    } catch (error) {
      this.logger.error(`구글 토큰 로그인 실패: ${error.message}`);
      throw error;
    }
  }
}
