import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { PasswordResetToken } from '../database/entities/password-reset-token.entity';
import { EmailVerificationToken } from '../database/entities/email-verification-token.entity';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { GlobalConfigService } from '../config/config.service';
import { MailService } from '../mail/mail.service';
import { DiscordService } from '../discord/discord.service';
import {
  createMockRepository,
  createMockJwtService,
  createMockConfigService,
  createMockDataSource,
} from '../test/mock-factories';
import { createTestUser, createTestAdminUser } from '../test/test-entities';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  const userRepo = createMockRepository();
  const adminRepo = createMockRepository();
  const passwordResetRepo = createMockRepository();
  const emailVerificationRepo = createMockRepository();
  const jwtService = createMockJwtService();
  const configService = createMockConfigService({ NODE_ENV: 'test' });
  const dataSource = createMockDataSource();

  const mockTicketsService = {
    grantTickets: jest.fn().mockResolvedValue({ granted: 1 }),
  };
  const mockGlobalConfigService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  };
  const mockMailService = {
    sendVerificationCode: jest.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  };
  const mockDiscordService = {
    notifySignup: jest.fn().mockResolvedValue(undefined),
    notifyError: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(AdminUser), useValue: adminRepo },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetRepo,
        },
        {
          provide: getRepositoryToken(EmailVerificationToken),
          useValue: emailVerificationRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: PredictionTicketsService, useValue: mockTicketsService },
        { provide: GlobalConfigService, useValue: mockGlobalConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: DiscordService, useValue: mockDiscordService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create user and return requireVerification', async () => {
      const testUser = createTestUser();
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(testUser);
      userRepo.save.mockResolvedValue(testUser);
      emailVerificationRepo.create.mockReturnValue({});
      emailVerificationRepo.save.mockResolvedValue({});

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        nickname: 'tester',
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(userRepo.save).toHaveBeenCalled();
      expect(result.requireVerification).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(mockMailService.sendVerificationCode).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate verified email', async () => {
      userRepo.findOne.mockResolvedValue(
        createTestUser({ isEmailVerified: true }),
      );

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'pass123',
          nickname: 'nn',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should resend verification for unverified existing user', async () => {
      const testUser = createTestUser({ isEmailVerified: false });
      userRepo.findOne.mockResolvedValue(testUser);
      emailVerificationRepo.create.mockReturnValue({});
      emailVerificationRepo.save.mockResolvedValue({});

      const result = await service.register({
        email: 'test@example.com',
        password: 'pass123',
        nickname: 'nn',
      });

      expect(result.requireVerification).toBe(true);
      expect(mockMailService.sendVerificationCode).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return token and user on valid verified credentials', async () => {
      const testUser = createTestUser({ isEmailVerified: true });
      userRepo.findOne.mockResolvedValue(testUser);

      const result = await service.login('test@example.com', 'password123');

      expect('accessToken' in result).toBe(true);
      const loginResult = result as {
        accessToken: string;
        user: { email: string };
      };
      expect(loginResult.accessToken).toBe('mock-jwt-token');
      expect(loginResult.user.email).toBe('test@example.com');
      expect(userRepo.update).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });

    it('should reject login for unverified user', async () => {
      const testUser = createTestUser({ isEmailVerified: false });
      userRepo.findOne.mockResolvedValue(testUser);

      await expect(
        service.login('test@example.com', 'password123'),
      ).rejects.toThrow('이메일 인증이 필요합니다');
    });

    it('should reject login for inactive user', async () => {
      const testUser = createTestUser({
        isActive: false,
        isEmailVerified: true,
      });
      userRepo.findOne.mockResolvedValue(testUser);

      await expect(
        service.login('test@example.com', 'password123'),
      ).rejects.toThrow('비활성화된 계정입니다');
    });

    it('should throw UnauthorizedException on wrong email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login('wrong@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser());
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('test@example.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('adminLogin', () => {
    it('should return token on valid admin credentials', async () => {
      const admin = createTestAdminUser();
      adminRepo.findOne.mockResolvedValue(admin);

      const result = await service.adminLogin('admin', 'password');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.loginId).toBe('admin');
    });

    it('should throw on inactive admin', async () => {
      adminRepo.findOne.mockResolvedValue(
        createTestAdminUser({ isActive: false }),
      );

      await expect(service.adminLogin('admin', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('should succeed with correct old password', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser());

      const result = await service.changePassword(1, 'oldpass', 'newpass');

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpass', 12);
      expect(userRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ password: 'hashed-password' }),
      );
      expect(result.message).toBeDefined();
    });

    it('should throw on wrong old password', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser());
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, 'wrong', 'new')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should create reset token for existing user', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser());

      const result = await service.forgotPassword('test@example.com');

      // Now uses transaction — manager.delete + manager.save
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });

    it('should return generic message for non-existent email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.message).toBeDefined();
      expect(passwordResetRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset within transaction on valid token', async () => {
      const record = {
        id: 1,
        userId: 1,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      };
      passwordResetRepo.findOne.mockResolvedValue(record);

      const result = await service.resetPassword('valid-token', 'newpassword');

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });

    it('should throw on expired token', async () => {
      const record = {
        id: 1,
        userId: 1,
        expiresAt: new Date(Date.now() - 1000),
      };
      passwordResetRepo.findOne.mockResolvedValue(record);

      await expect(
        service.resetPassword('expired-token', 'newpassword'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    it('should update hasSeenOnboarding', async () => {
      const user = createTestUser({ hasSeenOnboarding: false });
      userRepo.findOne.mockResolvedValue({ ...user });
      userRepo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateProfile(1, {
        hasSeenOnboarding: true,
      });

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ hasSeenOnboarding: true }),
      );
      expect(result).toBeDefined();
    });

    it('should not save when no fields changed', async () => {
      const user = createTestUser();
      userRepo.findOne.mockResolvedValue({ ...user });

      await service.updateProfile(1, {});

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should update nickname', async () => {
      const user = createTestUser();
      userRepo.findOne.mockResolvedValue({ ...user });
      userRepo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateProfile(1, {
        nickname: 'newNick',
      });

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nickname: 'newNick',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile(999, { nickname: 'test' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should throw on invalid code', async () => {
      emailVerificationRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw on expired code', async () => {
      emailVerificationRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        token: '123456',
        expiresAt: new Date(Date.now() - 1000), // expired
      });

      await expect(service.verifyEmail('123456')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
