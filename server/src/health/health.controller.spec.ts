import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return status ok and service name', () => {
      const result = controller.check();
      expect(result).toMatchObject({
        status: 'ok',
        service: 'OddsCast API',
        version: '1.0.0',
      });
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('detailed', () => {
    it('should return status ok and runtime info', () => {
      const result = controller.detailed();
      expect(result).toMatchObject({
        status: 'ok',
        service: 'OddsCast API',
        version: '1.0.0',
      });
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('nodeVersion');
      expect(result).toHaveProperty('platform');
    });
  });
});
