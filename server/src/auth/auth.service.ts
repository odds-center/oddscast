import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { GoogleTokenService, GoogleTokenInfo } from './google-token.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private googleTokenService: GoogleTokenService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, googleId: string): Promise<any> {
    const user = await this.usersService.findByGoogleId(googleId);

    if (user && user.isActive) {
      return user;
    }

    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      googleId: user.googleId,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }
    );

    // 리프레시 토큰을 사용자 정보에 저장
    await this.usersService.update(user.id, { refreshToken });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600, // 1시간
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        firstName: user.firstName,
        lastName: user.lastName,
        locale: user.locale,
      },
    };
  }

  async googleLogin(googleUser: any) {
    try {
      this.logger.log(`구글 로그인 시도: ${googleUser.email}`);

      // 사용자 찾기 또는 생성
      const user = await this.usersService.findOrCreateByGoogle(googleUser);

      this.logger.log(`사용자 로그인 성공: ${user.email}`);

      // JWT 토큰 생성
      return this.login(user);
    } catch (error) {
      this.logger.error(`구글 로그인 실패: ${error.message}`);
      throw error;
    }
  }

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

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('유효하지 않은 사용자입니다.');
      }

      // 저장된 리프레시 토큰과 비교
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('리프레시 토큰이 일치하지 않습니다.');
      }

      this.logger.log(`토큰 갱신 성공: ${user.email}`);

      return this.login(user);
    } catch (error) {
      this.logger.error(`토큰 갱신 실패: ${error.message}`);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  async logout(userId: string) {
    try {
      // 리프레시 토큰 무효화
      await this.usersService.update(userId, { refreshToken: null });
      this.logger.log(`사용자 로그아웃: ${userId}`);

      return { message: '로그아웃되었습니다.' };
    } catch (error) {
      this.logger.error(`로그아웃 실패: ${error.message}`);
      throw error;
    }
  }

  async revokeGoogleAccess(accessToken: string) {
    try {
      // 구글 액세스 토큰 무효화
      await axios.post('https://oauth2.googleapis.com/revoke', {
        token: accessToken,
      });

      this.logger.log('구글 액세스 토큰 무효화 성공');
    } catch (error) {
      this.logger.error(`구글 액세스 토큰 무효화 실패: ${error.message}`);
      // 무효화 실패는 로그만 남기고 에러를 던지지 않음
    }
  }
}
