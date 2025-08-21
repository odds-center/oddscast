import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { GoogleTokenService } from './google-token.service';
import { SocialAuthService } from './social-auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: GoogleStrategy,
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
          console.warn(
            'Google OAuth 설정이 없습니다. GoogleStrategy를 비활성화합니다.'
          );
          return null;
        }

        try {
          return new GoogleStrategy(configService);
        } catch (error) {
          console.warn('GoogleStrategy 초기화 실패:', error.message);
          return null;
        }
      },
      inject: [ConfigService],
    },
    GoogleTokenService,
    SocialAuthService,
    JwtStrategy,
  ].filter(Boolean),
  exports: [AuthService, GoogleTokenService, SocialAuthService],
})
export class AuthModule {}
