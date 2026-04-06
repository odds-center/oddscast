import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('KAKAO_CLIENT_ID'),
      clientSecret: configService.get<string>('KAKAO_CLIENT_SECRET', ''),
      callbackURL: configService.getOrThrow<string>('KAKAO_CALLBACK_URL'),
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void,
  ): Promise<void> {
    try {
      const kakaoId = String(profile.id);
      const email: string | undefined =
        (profile._json as Record<string, unknown> | undefined)?.[
          'kakao_account'
        ] !== undefined
          ? ((profile._json as Record<string, Record<string, unknown>>)[
              'kakao_account'
            ]['email'] as string | undefined)
          : undefined;
      const nickname: string =
        profile.displayName ??
        (
          profile._json as
            | Record<string, Record<string, Record<string, string>>>
            | undefined
        )?.['kakao_account']?.['profile']?.['nickname'] ??
        '카카오사용자';

      const user = await this.authService.findOrCreateKakaoUser({
        kakaoId,
        email,
        nickname,
      });
      done(null, user);
    } catch (err: unknown) {
      done(err);
    }
  }
}
