import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { PasswordResetToken } from '../database/entities/password-reset-token.entity';
import { EmailVerificationToken } from '../database/entities/email-verification-token.entity';
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

/** Signup bonus: 1 complimentary RACE ticket, 30 days expiry */
const SIGNUP_BONUS_TICKETS = 1;
const SIGNUP_BONUS_EXPIRES_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetRepo: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationRepo: Repository<EmailVerificationToken>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly predictionTicketsService: PredictionTicketsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('이미 등록된 이메일입니다');

    const hashed = await bcrypt.hash(dto.password, 10);
    const now = new Date();
    const user = this.userRepo.create({
      email: dto.email,
      password: hashed,
      name: dto.name,
      nickname: dto.nickname ?? null,
      updatedAt: now,
    });
    const saved = await this.userRepo.save(user);
    if (!saved) throw new Error('User insert failed');

    try {
      await this.predictionTicketsService.grantTickets(
        saved.id,
        SIGNUP_BONUS_TICKETS,
        SIGNUP_BONUS_EXPIRES_DAYS,
        'RACE',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.config.get('NODE_ENV') !== 'test') {
        console.warn(
          `[Auth] Signup bonus ticket grant failed for user ${saved.id}: ${msg}`,
        );
      }
    }

    const token = this.generateToken(saved.id, saved.email, saved.role);
    return { user: this.sanitize(saved), ...token };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user)
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');

    const now = new Date();
    await this.userRepo.update(user.id, { lastLoginAt: now, updatedAt: now });

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...token };
  }

  async adminLogin(loginId: string, password: string) {
    const admin = await this.adminRepo.findOne({ where: { loginId } });
    if (!admin)
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다');
    if (!admin.isActive)
      throw new UnauthorizedException('비활성화된 계정입니다');

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid)
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다');

    const now = new Date();
    await this.adminRepo.update(admin.id, { lastLoginAt: now, updatedAt: now });

    const token = this.generateToken(admin.id, admin.loginId, 'ADMIN');
    return { user: this.sanitizeAdmin(admin), ...token };
  }

  async getProfile(
    userId: number,
    role?: string,
  ): Promise<SanitizedUser | SanitizedAdminUser> {
    if (role === 'ADMIN') {
      const admin = await this.adminRepo.findOne({
        where: { id: userId },
        select: ['id', 'loginId', 'name', 'isActive', 'createdAt', 'updatedAt'],
      });
      if (!admin) throw new UnauthorizedException();
      return this.sanitizeAdmin(admin);
    }
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'name',
        'nickname',
        'avatar',
        'role',
        'isActive',
        'favoriteMeet',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'name',
        'nickname',
        'avatar',
        'role',
        'isActive',
        'favoriteMeet',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) throw new UnauthorizedException();

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.name === undefined && dto.nickname === undefined)
      return this.sanitize(user);

    await this.userRepo.save(user);
    return this.sanitize(user);
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid)
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(userId, {
      password: hashed,
      updatedAt: new Date(),
    });
    return { message: '비밀번호가 변경되었습니다' };
  }

  async deleteAccount(userId: number, password: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }
    await this.userRepo.update(userId, {
      isActive: false,
      updatedAt: new Date(),
    });
    return { message: '계정이 비활성화되었습니다' };
  }

  async refreshToken(userId: number, role?: string) {
    if (role === 'ADMIN') {
      const admin = await this.adminRepo.findOne({
        where: { id: userId },
        select: ['loginId'],
      });
      if (!admin) throw new UnauthorizedException();
      return this.generateToken(userId, admin.loginId, 'ADMIN');
    }
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['email', 'role'],
    });
    if (!user) throw new UnauthorizedException();
    return this.generateToken(userId, user.email, user.role);
  }

  async forgotPassword(
    email: string,
  ): Promise<{ message: string; resetToken?: string }> {
    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
      select: ['id'],
    });
    if (!user) {
      return { message: '비밀번호 재설정 이메일이 발송되었습니다.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.passwordResetRepo.delete({ userId: user.id });
    await this.passwordResetRepo.save(
      this.passwordResetRepo.create({
        userId: user.id,
        token,
        expiresAt,
      }),
    );

    const devReturnToken = this.config.get('DEV_RETURN_RESET_TOKEN') === 'true';
    return {
      message: '비밀번호 재설정 이메일이 발송되었습니다.',
      ...(devReturnToken && { resetToken: token }),
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const record = await this.passwordResetRepo.findOne({
      where: { token },
      select: ['id', 'userId', 'expiresAt'],
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('유효하지 않거나 만료된 토큰입니다.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { id: record.userId },
        { password: hashed, updatedAt: new Date() },
      );
      await manager.delete(PasswordResetToken, { id: record.id });
    });
    return { message: '비밀번호가 재설정되었습니다.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const record = await this.emailVerificationRepo.findOne({
      where: { token },
      select: ['id', 'userId', 'expiresAt'],
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('유효하지 않거나 만료된 토큰입니다.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { id: record.userId },
        { isEmailVerified: true, updatedAt: new Date() },
      );
      await manager.delete(EmailVerificationToken, { id: record.id });
    });
    return { message: '이메일이 인증되었습니다.' };
  }

  async resendVerification(
    email: string,
  ): Promise<{ message: string; verificationToken?: string }> {
    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
      select: ['id', 'isEmailVerified'],
    });
    if (!user) return { message: '인증 메일이 재발송되었습니다.' };
    if (user.isEmailVerified) return { message: '이미 인증된 이메일입니다.' };

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.emailVerificationRepo.delete({ userId: user.id });
    await this.emailVerificationRepo.save(
      this.emailVerificationRepo.create({
        userId: user.id,
        token,
        expiresAt,
      }),
    );

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

  private sanitize(user: User): SanitizedUser {
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

  private sanitizeAdmin(admin: AdminUser): SanitizedAdminUser {
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
