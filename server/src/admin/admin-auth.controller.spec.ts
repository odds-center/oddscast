import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthController } from './admin-auth.controller';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';

const mockAuthService = {
  adminLogin: jest.fn(),
  getProfile: jest.fn(),
  refreshToken: jest.fn(),
};

const mockAdminUser: JwtPayload = {
  sub: 99,
  email: 'admin@oddscast.kr',
  role: UserRole.ADMIN,
};

describe('AdminAuthController', () => {
  let controller: AdminAuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminAuthController>(AdminAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should delegate to authService.adminLogin', () => {
      const dto = { loginId: 'admin', password: 'admin1234' };
      const expected = { accessToken: 'jwt-token' };
      mockAuthService.adminLogin.mockReturnValue(expected);

      const result = controller.login(dto);

      expect(mockAuthService.adminLogin).toHaveBeenCalledWith(
        'admin',
        'admin1234',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('getMe', () => {
    it('should delegate to authService.getProfile with sub and role', () => {
      const expected = { id: 99, loginId: 'admin', role: 'ADMIN' };
      mockAuthService.getProfile.mockReturnValue(expected);

      const result = controller.getMe(mockAdminUser);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(
        99,
        UserRole.ADMIN,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('refreshToken', () => {
    it('should delegate to authService.refreshToken with sub and role', () => {
      const expected = { accessToken: 'new-jwt-token' };
      mockAuthService.refreshToken.mockReturnValue(expected);

      const result = controller.refreshToken(mockAdminUser);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        99,
        UserRole.ADMIN,
      );
      expect(result).toEqual(expected);
    });
  });
});
