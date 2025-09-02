import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException(JWT_CONSTANTS.ERROR_MESSAGES.INVALID_PAYLOAD);
    }

    // 데이터베이스에서 사용자 정보 확인
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(JWT_CONSTANTS.ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || payload.name,
      avatar: user.avatar,
      role: user.role || payload.role,
      provider: user.authProvider || payload.provider,
    };
  }
}
