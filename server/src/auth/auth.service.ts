import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { RegisterDto, UpdateProfileDto } from './dto/auth.dto';

export interface SanitizedUser {
  id: number;
  email: string;
  name: string;
  nickname: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  favoriteMeet: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SanitizedAdminUser {
  id: number;
  loginId: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Signup bonus: 1 complimentary RACE ticket, 30 days expiry (FEATURE_ROADMAP 5.1) */
const SIGNUP_BONUS_TICKETS = 1;
const SIGNUP_BONUS_EXPIRES_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private predictionTicketsService: PredictionTicketsService,
  ) {}

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

    try {
      await this.predictionTicketsService.grantTickets(
        user.id,
        SIGNUP_BONUS_TICKETS,
        SIGNUP_BONUS_EXPIRES_DAYS,
        'RACE',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.config.get('NODE_ENV') !== 'test') {
        console.warn(
          `[Auth] Signup bonus ticket grant failed for user ${user.id}: ${msg}`,
        );
      }
    }

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

  async adminLogin(loginId: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { loginId },
    });
    if (!admin)
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다');

    if (!admin.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다');
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid)
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다');

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(admin.id, admin.loginId, 'ADMIN');
    return { user: this.sanitizeAdmin(admin), ...token };
  }

  async getProfile(
    userId: number,
    role?: string,
  ): Promise<SanitizedUser | SanitizedAdminUser> {
    if (role === 'ADMIN') {
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: userId },
      });
      if (!admin) throw new UnauthorizedException();
      return this.sanitizeAdmin(admin);
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return this.sanitize(user);
  }

  async changePassword(
    userId: number,
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

  async deleteAccount(userId: number, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return { message: '계정이 비활성화되었습니다' };
  }

  async refreshToken(userId: number, role?: string) {
    if (role === 'ADMIN') {
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: userId },
      });
      if (!admin) throw new UnauthorizedException();
      return this.generateToken(admin.id, admin.loginId, 'ADMIN');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.generateToken(user.id, user.email, user.role);
  }

  /** 비밀번호 찾기: 토큰 생성·저장. 이메일 미설정 시 개발용 토큰 반환 */
  async forgotPassword(
    email: string,
  ): Promise<{ message: string; resetToken?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return { message: '비밀번호 재설정 이메일이 발송되었습니다.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resendApiKey = this.config.get('RESEND_API_KEY');
    if (resendApiKey) {
      // TODO: Resend 등 이메일 발송 연동
      // await this.sendPasswordResetEmail(user.email, token);
    }

    const devReturnToken = this.config.get('DEV_RETURN_RESET_TOKEN') === 'true';
    return {
      message: '비밀번호 재설정 이메일이 발송되었습니다.',
      ...(devReturnToken && { resetToken: token }),
    };
  }

  /** 비밀번호 재설정: 토큰 검증 후 갱신 */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('유효하지 않거나 만료된 토큰입니다.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: record.id } }),
    ]);
    return { message: '비밀번호가 재설정되었습니다.' };
  }

  /** 이메일 인증: 토큰 검증 후 isEmailVerified 갱신 */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('유효하지 않거나 만료된 토큰입니다.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);
    return { message: '이메일이 인증되었습니다.' };
  }

  /** 인증 메일 재발송 */
  async resendVerification(
    email: string,
  ): Promise<{ message: string; verificationToken?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return { message: '인증 메일이 재발송되었습니다.' };
    }
    if (user.isEmailVerified) {
      return { message: '이미 인증된 이메일입니다.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });
    await this.prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resendApiKey = this.config.get('RESEND_API_KEY');
    if (resendApiKey) {
      // TODO: Resend 등 이메일 발송 연동
      // await this.sendVerificationEmail(user.email, token);
    }

    const devReturnToken = this.config.get('DEV_RETURN_RESET_TOKEN') === 'true';
    return {
      message: '인증 메일이 재발송되었습니다.',
      ...(devReturnToken && { verificationToken: token }),
    };
  }

  private generateToken(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }

  private sanitize(user: {
    id: number;
    email: string;
    name: string;
    nickname: string | null;
    avatar: string | null;
    role: string;
    isActive: boolean;
    password: string;
    favoriteMeet?: string | null;
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
      favoriteMeet: user.favoriteMeet ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private sanitizeAdmin(admin: {
    id: number;
    loginId: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SanitizedAdminUser {
    return {
      id: admin.id,
      loginId: admin.loginId,
      name: admin.name,
      role: 'ADMIN',
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
