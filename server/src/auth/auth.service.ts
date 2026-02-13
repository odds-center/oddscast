import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, UpdateProfileDto } from './dto/auth.dto';

export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(clientId);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('이미 등록된 이메일입니다');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        nickname: dto.nickname,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...token };
  }

  async googleLogin(idToken: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Google 로그인이 설정되지 않았습니다.');
    }

    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 Google 토큰입니다.');
    }

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException('Google 프로필에서 이메일을 가져올 수 없습니다.');
    }

    const { email, name, picture } = payload;
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // 신규 구글 사용자: 랜덤 비밀번호로 생성 (구글 로그인만 사용)
      const randomPassword = await bcrypt.hash(
        `google_${Date.now()}_${Math.random().toString(36)}`,
        10,
      );
      const baseName = name || email.split('@')[0];
      user = await this.prisma.user.create({
        data: {
          email,
          password: randomPassword,
          name: baseName,
          nickname: baseName, // 필수: 구글 이름 또는 이메일 prefix
          avatar: picture || null,
          isEmailVerified: true,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          avatar: picture || user.avatar,
        },
      });
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...token };
  }

  async adminLogin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('관리자 권한이 없습니다');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...token };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return this.sanitize(user);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid)
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { message: '비밀번호가 변경되었습니다' };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return { message: '계정이 비활성화되었습니다' };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.generateToken(user.id, user.email, user.role);
  }

  private generateToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }

  private sanitize(user: {
    id: string;
    email: string;
    name: string;
    nickname: string | null;
    avatar: string | null;
    role: string;
    isActive: boolean;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: unknown;
  }): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
