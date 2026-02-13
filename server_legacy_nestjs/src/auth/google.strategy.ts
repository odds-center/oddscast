import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService) {
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
      throw new Error(
        'Google OAuth 설정이 누락되었습니다. GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 설정해주세요.'
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL: configService.get(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3002/api/auth/google/callback'
      ),
      scope: ['email', 'profile'],
    });

    this.logger.log('Google OAuth Strategy 초기화 완료');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    try {
      this.logger.log(`구글 OAuth 검증 시작: ${profile.emails?.[0]?.value}`);

      const { name, emails, photos, id } = profile;

      // 필수 정보 검증
      if (!emails || !emails[0] || !emails[0].value) {
        this.logger.error('이메일 정보가 없습니다.');
        return done(new Error('이메일 정보가 필요합니다.'), null);
      }

      if (!name || (!name.givenName && !name.familyName)) {
        this.logger.error('이름 정보가 없습니다.');
        return done(new Error('이름 정보가 필요합니다.'), null);
      }

      const user = {
        email: emails[0].value,
        name:
          name.givenName && name.familyName
            ? `${name.givenName} ${name.familyName}`.trim()
            : name.givenName || name.familyName || 'Unknown User',
        firstName: name.givenName || '',
        lastName: name.familyName || '',
        avatar: photos && photos[0] ? photos[0].value : '',
        googleId: id,
        accessToken,
        refreshToken,
        locale: profile._json.locale || 'ko',
      };

      this.logger.log(`구글 OAuth 검증 성공: ${user.email}`);
      done(null, user);
    } catch (error) {
      this.logger.error(`구글 OAuth 검증 실패: ${error.message}`);
      done(error, null);
    }
  }
}
