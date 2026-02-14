import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'goldenrace-secret'),
    });
  }

  async validate(payload: any) {
    if (payload.sub == null) throw new UnauthorizedException();
    const sub =
      typeof payload.sub === 'number'
        ? payload.sub
        : parseInt(String(payload.sub), 10);
    if (isNaN(sub)) throw new UnauthorizedException();
    return { sub, email: payload.email, role: payload.role };
  }
}
