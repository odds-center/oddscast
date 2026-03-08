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
import { PointsService } from '../points/points.service';
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
  const mockPointsService = {
    grantDailyLoginBonus: jest.fn().mockResolvedValue({ points: 10 }),
  };
  const mockGlobalConfigService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  };
  const mockMailService = {
    sendVerificationCode: jest.fn().mockResolvedValue({ success: true }),
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
        { provide: PointsService, useValue: mockPointsService },
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
        name: 'Test User',
        nickname: 'tester',
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
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
          name: 'N',
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
        name: 'N',
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
      const loginResult = result as { accessToken: string; user: { email: string } };
      expect(loginResult.accessToken).toBe('mock-jwt-token');
      expect(loginResult.user.email).toBe('test@example.com');
      expect(userRepo.update).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });

    it('should return requireVerification for unverified user', async () => {
      const testUser = createTestUser({ isEmailVerified: false });
      userRepo.findOne.mockResolvedValue(testUser);
      emailVerificationRepo.create.mockReturnValue({});
      emailVerificationRepo.save.mockResolvedValue({});

      const result = await service.login('test@example.com', 'password123');

      expect('requireVerification' in result).toBe(true);
      const verifyResult = result as { requireVerification: boolean; email: string };
      expect(verifyResult.requireVerification).toBe(true);
      expect(verifyResult.email).toBe('test@example.com');
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

    it('should call processLoginBonuses on success for verified user', async () => {
      const testUser = createTestUser({
        isEmailVerified: true,
        lastDailyBonusAt: null,
      });
      userRepo.findOne.mockResolvedValue(testUser);

      await service.login('test@example.com', 'password123');

      expect(mockPointsService.grantDailyLoginBonus).toHaveBeenCalledWith(
        testUser.id,
      );
    });
  });

  describe('processLoginBonuses', () => {
    it('should grant daily bonus when different KST day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const testUser = createTestUser({ lastDailyBonusAt: yesterday });
      userRepo.findOne.mockResolvedValue(testUser);

      const result = await service.processLoginBonuses(1);

      expect(mockPointsService.grantDailyLoginBonus).toHaveBeenCalledWith(1);
      expect(result.dailyBonusGranted).toBe(true);
      expect(result.dailyBonusPoints).toBe(10);
    });

    it('should skip bonus on same KST day', async () => {
      const now = new Date();
      const testUser = createTestUser({ lastDailyBonusAt: now });
      userRepo.findOne.mockResolvedValue(testUser);

      const result = await service.processLoginBonuses(1);

      expect(mockPointsService.grantDailyLoginBonus).not.toHaveBeenCalled();
      expect(result.dailyBonusGranted).toBe(false);
    });

    it('should increment consecutive streak (yesterday to today)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKST = yesterday.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Seoul',
      });
      const testUser = createTestUser({
        lastDailyBonusAt: null,
        lastConsecutiveLoginDate: yesterdayKST,
        consecutiveLoginDays: 3,
      });
      userRepo.findOne.mockResolvedValue(testUser);

      const result = await service.processLoginBonuses(1);

      expect(result.consecutiveDays).toBe(4);
      expect(userRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ consecutiveLoginDays: 4 }),
      );
    });

    it('should reset streak when gap > 1 day', async () => {
      const testUser = createTestUser({
        lastDailyBonusAt: null,
        lastConsecutiveLoginDate: '2025-01-01',
        consecutiveLoginDays: 5,
      });
      userRepo.findOne.mockResolvedValue(testUser);

      const result = await service.processLoginBonuses(1);

      expect(result.consecutiveDays).toBe(1);
    });

    it('should grant ticket and reset at 7-day streak', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKST = yesterday.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Seoul',
      });
      const testUser = createTestUser({
        lastDailyBonusAt: null,
        lastConsecutiveLoginDate: yesterdayKST,
        consecutiveLoginDays: 6,
      });
      userRepo.findOne.mockResolvedValue(testUser);

      const result = await service.processLoginBonuses(1);

      expect(mockTicketsService.grantTickets).toHaveBeenCalledWith(
        1,
        1,
        30,
        'RACE',
      );
      expect(result.consecutiveRewardGranted).toBe(true);
      expect(result.consecutiveDays).toBe(0);
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

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpass', 10);
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
      passwordResetRepo.create.mockReturnValue({ userId: 1, token: 'abc' });
      passwordResetRepo.save.mockResolvedValue({ userId: 1, token: 'abc' });

      const result = await service.forgotPassword('test@example.com');

      expect(passwordResetRepo.delete).toHaveBeenCalledWith({ userId: 1 });
      expect(passwordResetRepo.save).toHaveBeenCalled();
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
});
