import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.service';
import { UsersService } from '../users/users.service';
import { JWT_CONSTANTS, ENV_KEYS } from '../common/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(ENV_KEYS.JWT.SECRET),
    });
  }

  async validate(payload: JwtPayload) {
    console.log('🔐 JWT Strategy validate called with payload:', {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      provider: payload.provider,
    });

    if (!payload.sub || !payload.email) {
      console.log('❌ Invalid payload: missing sub or email');
      throw new UnauthorizedException(
        JWT_CONSTANTS.ERROR_MESSAGES.INVALID_PAYLOAD
      );
    }

    try {
      // 사용자 조회 시도
      let user = await this.usersService.findById(payload.sub);
      console.log('✅ Existing user found:', user.email);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        // 사용자가 없으면 생성
        console.log('👤 User not found, creating new user:', payload.email);
        try {
          const user = await this.usersService.create({
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload.email?.split('@')[0] || 'User',
            avatar: null,
            authProvider: payload.provider || 'google',
            providerId: payload.sub,
            role: payload.role || 'user',
          });
          console.log('✅ New user created:', user.id);
          return user;
        } catch (createError) {
          console.error('❌ Error creating user:', createError.message);
          throw new UnauthorizedException(
            JWT_CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN
          );
        }
      } else {
        console.error('❌ Error in JWT validation:', error.message);
        throw new UnauthorizedException(
          JWT_CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN
        );
      }
    }
  }
}
