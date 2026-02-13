import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import {
  JWT_CONSTANTS,
  USER_CONSTANTS,
  SOCIAL_AUTH_CONSTANTS,
  ENV_KEYS,
} from '../common/constants';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role?: string;
  provider?: string;
  iat?: number;
  exp?: number;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * JWT 액세스 토큰을 생성합니다.
   */
  generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name || user.email?.split('@')[0] || 'User',
      role: user.role || USER_CONSTANTS.DEFAULTS.ROLE,
      provider: user.authProvider || SOCIAL_AUTH_CONSTANTS.PROVIDERS.GOOGLE,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get(ENV_KEYS.JWT.SECRET),
      expiresIn: this.configService.get(
        ENV_KEYS.JWT.EXPIRES_IN,
        JWT_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN
      ),
    });
  }

  /**
   * JWT 리프레시 토큰을 생성합니다.
   */
  generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name || user.email?.split('@')[0] || 'User',
      role: user.role || USER_CONSTANTS.DEFAULTS.ROLE,
      provider: user.authProvider || SOCIAL_AUTH_CONSTANTS.PROVIDERS.GOOGLE,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get(ENV_KEYS.JWT.SECRET),
      expiresIn: this.configService.get(
        ENV_KEYS.JWT.REFRESH_EXPIRES_IN,
        JWT_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN
      ),
    });
  }

  /**
   * JWT 토큰 쌍을 생성합니다.
   */
  generateTokens(user: User): JwtTokens {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const expiresIn = this.getTokenExpirationTime(
      this.configService.get(
        ENV_KEYS.JWT.EXPIRES_IN,
        JWT_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN
      )
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * JWT 토큰을 검증합니다.
   */
  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get(ENV_KEYS.JWT.SECRET),
      });
    } catch (error) {
      this.logger.error('JWT 토큰 검증 실패:', error.message);
      throw new UnauthorizedException(
        JWT_CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN
      );
    }
  }

  /**
   * JWT 토큰에서 페이로드를 추출합니다.
   */
  decodeToken(token: string): JwtPayload {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      this.logger.error('JWT 토큰 디코딩 실패:', error.message);
      throw new UnauthorizedException(
        JWT_CONSTANTS.ERROR_MESSAGES.TOKEN_DECODE_FAILED
      );
    }
  }

  /**
   * 토큰 만료 시간을 밀리초로 변환합니다.
   */
  private getTokenExpirationTime(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000; // 기본 1시간
    }
  }

  /**
   * 토큰이 만료되었는지 확인합니다.
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * 토큰에서 사용자 ID를 추출합니다.
   */
  extractUserIdFromToken(token: string): string {
    const payload = this.verifyToken(token);
    return payload.sub;
  }

  /**
   * 토큰에서 사용자 이메일을 추출합니다.
   */
  extractUserEmailFromToken(token: string): string {
    const payload = this.verifyToken(token);
    return payload.email;
  }
}
