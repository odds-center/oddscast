import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  adminLogin: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
  deleteAccount: jest.fn(),
  refreshToken: jest.fn(),
};

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@example.com',
  role: UserRole.USER,
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should delegate to authService.register', async () => {
      const dto = { email: 'a@b.com', password: 'pw', name: 'A' };
      const expected = { accessToken: 'tok' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto as never);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('login', () => {
    it('should delegate to authService.login with email and password', async () => {
      const dto = { email: 'a@b.com', password: 'pw123' };
      const expected = { accessToken: 'tok', user: { id: 1 } };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto as never);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(result).toBe(expected);
    });
  });

  describe('adminLogin', () => {
    it('should delegate to authService.adminLogin with loginId and password', async () => {
      const dto = { loginId: 'admin', password: 'admin1234' };
      const expected = { accessToken: 'admin-tok' };
      mockAuthService.adminLogin.mockResolvedValue(expected);

      const result = await controller.adminLogin(dto as never);

      expect(mockAuthService.adminLogin).toHaveBeenCalledWith(
        dto.loginId,
        dto.password,
      );
      expect(result).toBe(expected);
    });
  });

  describe('logout', () => {
    it('should return success message without calling service', () => {
      const result = controller.logout(mockUser);
      expect(result).toEqual({ message: '로그아웃 성공' });
    });
  });

  describe('getMe / getProfile', () => {
    it('getMe should call getProfile with user sub and role', async () => {
      const profile = { id: 1, email: 'test@example.com' };
      mockAuthService.getProfile.mockResolvedValue(profile);

      const result = await controller.getMe(mockUser);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(
        mockUser.sub,
        mockUser.role,
      );
      expect(result).toBe(profile);
    });

    it('getProfile should call getProfile with user sub and role', async () => {
      const profile = { id: 1, email: 'test@example.com' };
      mockAuthService.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile(mockUser);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(
        mockUser.sub,
        mockUser.role,
      );
      expect(result).toBe(profile);
    });
  });

  describe('updateProfile', () => {
    it('should delegate to authService.updateProfile', async () => {
      const dto = { name: 'New Name' };
      const updated = { id: 1, name: 'New Name' };
      mockAuthService.updateProfile.mockResolvedValue(updated);

      const result = await controller.updateProfile(mockUser, dto as never);

      expect(mockAuthService.updateProfile).toHaveBeenCalledWith(
        mockUser.sub,
        dto,
      );
      expect(result).toBe(updated);
    });
  });

  describe('updatePassword / changePassword', () => {
    it('updatePassword should call changePassword with oldPassword and newPassword', async () => {
      const dto = { oldPassword: 'old', newPassword: 'new123' };
      mockAuthService.changePassword.mockResolvedValue({ message: 'changed' });

      await controller.updatePassword(mockUser, dto as never);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        mockUser.sub,
        dto.oldPassword,
        dto.newPassword,
      );
    });

    it('changePassword (legacy) should call changePassword with oldPassword and newPassword', async () => {
      const dto = { oldPassword: 'old', newPassword: 'new123' };
      mockAuthService.changePassword.mockResolvedValue({ message: 'changed' });

      await controller.changePassword(mockUser, dto as never);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        mockUser.sub,
        dto.oldPassword,
        dto.newPassword,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should delegate to authService.forgotPassword', async () => {
      const dto = { email: 'a@b.com' };
      mockAuthService.forgotPassword.mockResolvedValue({ message: 'sent' });

      await controller.forgotPassword(dto as never);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('resetPassword', () => {
    it('should delegate to authService.resetPassword', async () => {
      const dto = { token: 'reset-tok', newPassword: 'newpw' };
      mockAuthService.resetPassword.mockResolvedValue({ message: 'reset' });

      await controller.resetPassword(dto as never);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        dto.token,
        dto.newPassword,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should delegate to authService.verifyEmail', async () => {
      const dto = { token: 'verify-tok' };
      mockAuthService.verifyEmail.mockResolvedValue({ message: 'verified' });

      await controller.verifyEmail(dto as never);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(dto.token);
    });
  });

  describe('resendVerification', () => {
    it('should delegate to authService.resendVerification', async () => {
      const dto = { email: 'a@b.com' };
      mockAuthService.resendVerification.mockResolvedValue({ message: 'sent' });

      await controller.resendVerification(dto as never);

      expect(mockAuthService.resendVerification).toHaveBeenCalledWith(
        dto.email,
      );
    });
  });

  describe('deleteAccount', () => {
    it('should delegate to authService.deleteAccount', async () => {
      const dto = { password: 'mypassword' };
      mockAuthService.deleteAccount.mockResolvedValue({ message: 'deleted' });

      await controller.deleteAccount(mockUser, dto as never);

      expect(mockAuthService.deleteAccount).toHaveBeenCalledWith(
        mockUser.sub,
        dto.password,
      );
    });
  });

  describe('refreshToken', () => {
    it('should delegate to authService.refreshToken', async () => {
      const expected = { accessToken: 'new-tok' };
      mockAuthService.refreshToken.mockResolvedValue(expected);

      const result = await controller.refreshToken(mockUser);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        mockUser.sub,
        mockUser.role,
      );
      expect(result).toBe(expected);
    });
  });

  describe('checkAuth', () => {
    it('should return authenticated flag with userId', () => {
      const result = controller.checkAuth(mockUser);
      expect(result).toEqual({ authenticated: true, userId: mockUser.sub });
    });
  });
});
