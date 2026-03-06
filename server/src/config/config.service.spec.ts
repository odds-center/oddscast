import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GlobalConfigService } from './config.service';
import { GlobalConfig } from '../database/entities/global-config.entity';
import { createMockRepository } from '../test/mock-factories';

describe('GlobalConfigService', () => {
  let service: GlobalConfigService;
  let configRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    configRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalConfigService,
        { provide: getRepositoryToken(GlobalConfig), useValue: configRepo },
      ],
    }).compile();

    service = module.get<GlobalConfigService>(GlobalConfigService);
  });

  describe('getAll', () => {
    it('returns all config as key-value map', async () => {
      configRepo.find.mockResolvedValue([
        { key: 'feature_x', value: 'true' },
        { key: 'limit', value: '100' },
      ]);

      const result = await service.getAll();

      expect(result).toEqual({ feature_x: 'true', limit: '100' });
    });

    it('returns empty map when no configs', async () => {
      configRepo.find.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual({});
    });
  });

  describe('get', () => {
    it('returns value for existing key', async () => {
      configRepo.findOne.mockResolvedValue({ value: 'hello' });

      const result = await service.get('my_key');

      expect(result).toBe('hello');
      expect(configRepo.findOne).toHaveBeenCalledWith({
        where: { key: 'my_key' },
        select: ['value'],
      });
    });

    it('returns null when key does not exist', async () => {
      configRepo.findOne.mockResolvedValue(null);

      const result = await service.get('missing_key');

      expect(result).toBeNull();
    });
  });

  describe('getBoolean', () => {
    it.each([
      ['true', true],
      ['1', true],
      ['yes', true],
    ])('returns true for value "%s"', async (val, expected) => {
      configRepo.findOne.mockResolvedValue({ value: val });
      expect(await service.getBoolean('flag')).toBe(expected);
    });

    it.each([['false'], ['0'], ['no'], ['off']])(
      'returns false for value "%s"',
      async (val) => {
        configRepo.findOne.mockResolvedValue({ value: val });
        expect(await service.getBoolean('flag')).toBe(false);
      },
    );

    it('returns defaultValue when key is missing', async () => {
      configRepo.findOne.mockResolvedValue(null);

      expect(await service.getBoolean('missing', true)).toBe(true);
      expect(await service.getBoolean('missing', false)).toBe(false);
    });
  });

  describe('set', () => {
    it('upserts config entry', async () => {
      await service.set('my_key', 'my_value');

      expect(configRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'my_key', value: 'my_value' }),
        { conflictPaths: ['key'] },
      );
    });
  });
});
