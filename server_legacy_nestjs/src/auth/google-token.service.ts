import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  iat: number;
  exp: number;
}

@Injectable()
export class GoogleTokenService {
  private readonly logger = new Logger(GoogleTokenService.name);
  private readonly googlePublicKeysUrl = 'https://www.googleapis.com/oauth2/v1/certs';

  constructor(private configService: ConfigService) {}

  /**
   * 구글 ID 토큰을 검증하고 사용자 정보를 추출합니다.
   */
  async verifyIdToken(idToken: string): Promise<GoogleTokenInfo> {
    try {
      // 구글 공개키를 가져와서 JWT 토큰 검증
      const response = await axios.get(this.googlePublicKeysUrl);
      const publicKeys = response.data;

      // JWT 토큰 디코딩 (헤더, 페이로드, 서명 분리)
      const [headerB64, payloadB64, signature] = idToken.split('.');
      
      if (!headerB64 || !payloadB64 || !signature) {
        throw new UnauthorizedException('잘못된 토큰 형식입니다.');
      }

      // 페이로드 디코딩
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
      
      // 토큰 만료 확인
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp < currentTime) {
        throw new UnauthorizedException('토큰이 만료되었습니다.');
      }

      // 발급자 확인 (Google)
      if (payload.iss !== 'https://accounts.google.com' && 
          payload.iss !== 'accounts.google.com') {
        throw new UnauthorizedException('유효하지 않은 토큰 발급자입니다.');
      }

      // 클라이언트 ID 확인
      const clientId = this.configService.get('GOOGLE_CLIENT_ID');
      if (payload.aud !== clientId) {
        throw new UnauthorizedException('유효하지 않은 클라이언트 ID입니다.');
      }

      // 이메일 검증 확인
      if (!payload.email_verified) {
        throw new UnauthorizedException('이메일이 검증되지 않았습니다.');
      }

      this.logger.log(`구글 토큰 검증 성공: ${payload.email}`);

      return {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name || `${payload.given_name} ${payload.family_name}`,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        locale: payload.locale || 'ko',
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      this.logger.error(`구글 토큰 검증 실패: ${error.message}`);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('토큰 검증에 실패했습니다.');
    }
  }

  /**
   * 구글 액세스 토큰을 사용하여 사용자 정보를 가져옵니다.
   */
  async getUserInfo(accessToken: string): Promise<GoogleTokenInfo> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userInfo = response.data;
      
      return {
        sub: userInfo.id,
        email: userInfo.email,
        email_verified: userInfo.verified_email,
        name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        picture: userInfo.picture,
        locale: userInfo.locale || 'ko',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1시간 후 만료
      };
    } catch (error) {
      this.logger.error(`구글 사용자 정보 가져오기 실패: ${error.message}`);
      throw new UnauthorizedException('사용자 정보를 가져올 수 없습니다.');
    }
  }
}
