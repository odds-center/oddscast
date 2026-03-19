import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { GlobalConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockConfigService = {
  getAll: jest.fn(),
  set: jest.fn(),
};

describe('ConfigController', () => {
  let controller: ConfigController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        { provide: GlobalConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConfigController>(ConfigController);
  });

  describe('getAll', () => {
    it('should return all config key-value pairs', async () => {
      const configs = { show_google_login: 'true', maintenance: 'false' };
      mockConfigService.getAll.mockResolvedValue(configs);

      const result = await controller.getAll();

      expect(mockConfigService.getAll).toHaveBeenCalled();
      expect(result).toBe(configs);
    });
  });

  describe('set', () => {
    it('should update a config value and return key-value', async () => {
      mockConfigService.set.mockResolvedValue(undefined);

      const result = await controller.set('show_google_login', {
        value: 'false',
      });

      expect(mockConfigService.set).toHaveBeenCalledWith(
        'show_google_login',
        'false',
      );
      expect(result).toEqual({ key: 'show_google_login', value: 'false' });
    });
  });
});
