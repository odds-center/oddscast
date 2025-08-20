import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
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

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async googleLogin(googleUser: any) {
    // 사용자 찾기 또는 생성
    const user = await this.usersService.findOrCreateByGoogle(googleUser);

    // JWT 토큰 생성
    return this.login(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('유효하지 않은 사용자입니다.');
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
