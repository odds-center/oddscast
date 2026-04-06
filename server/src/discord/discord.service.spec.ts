import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  DiscordService,
  DevServerError,
  DevClientError,
  DevSignupNotification,
} from './discord.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DiscordService', () => {
  let service: DiscordService;

  const createService = async (envOverrides: Record<string, string> = {}) => {
    const defaults: Record<string, string> = {
      DISCORD_BOT_TOKEN: 'test-bot-token',
      DISCORD_SIGNUP_CHANNEL_ID: 'signup-ch-123',
      DISCORD_ERROR_CHANNEL_ID: 'error-ch-456',
      DISCORD_DEV_WEBHOOK_URL: '',
      NODE_ENV: 'production',
      ...envOverrides,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (key: string, fallback: string) => defaults[key] ?? fallback,
            ),
          },
        },
      ],
    }).compile();
    return module.get<DiscordService>(DiscordService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockResolvedValue({ status: 200, data: {} });
    service = await createService();
  });

  describe('notifySignup', () => {
    it('should send signup embed to Discord channel', async () => {
      await service.notifySignup('user@test.com', 'TestUser');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/channels/signup-ch-123/messages'),
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              title: expect.stringContaining('회원가입'),
            }),
          ]),
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bot test-bot-token' },
        }),
      );
    });

    it('should not send when bot token is empty', async () => {
      service = await createService({ DISCORD_BOT_TOKEN: '' });
      await service.notifySignup('user@test.com');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('notifyError', () => {
    it('should send error embed with stack trace', async () => {
      await service.notifyError(
        'POST',
        '/api/test',
        500,
        'Server error',
        'Error: stack...',
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/channels/error-ch-456/messages'),
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              title: expect.stringContaining('500'),
              color: 0xb91c1c,
            }),
          ]),
        }),
        expect.anything(),
      );
    });

    it('should handle Discord API failure gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));
      await expect(
        service.notifyError('GET', '/api/test', 503, 'timeout'),
      ).resolves.toBeUndefined();
    });
  });

  describe('dev webhook', () => {
    it('should send to dev webhook when not in production', async () => {
      service = await createService({
        DISCORD_BOT_TOKEN: '',
        DISCORD_DEV_WEBHOOK_URL: 'https://discord.com/api/webhooks/test',
        NODE_ENV: 'development',
      });

      await service.notifyError('GET', '/api/test', 500, 'error', 'stack...');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              title: expect.stringContaining('[DEV]'),
            }),
          ]),
        }),
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('should NOT send to dev webhook in production', async () => {
      service = await createService({
        DISCORD_BOT_TOKEN: '',
        DISCORD_DEV_WEBHOOK_URL: 'https://discord.com/api/webhooks/test',
        NODE_ENV: 'production',
      });

      await service.notifyError('GET', '/api/test', 500, 'error');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should send client errors to dev webhook', async () => {
      service = await createService({
        DISCORD_BOT_TOKEN: '',
        DISCORD_DEV_WEBHOOK_URL: 'https://discord.com/api/webhooks/test',
        NODE_ENV: 'development',
      });

      await service.notifyClientError(
        'POST',
        '/api/auth/login',
        401,
        'Unauthorized',
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              title: expect.stringContaining('[DEV]'),
            }),
          ]),
        }),
        expect.anything(),
      );
    });
  });

  describe('DevNotification classes', () => {
    it('DevServerError should produce correct embed', () => {
      const notification = new DevServerError(
        'GET',
        '/api/test',
        500,
        'fail',
        'Error: stack',
      );
      const embed = notification.toEmbed();
      expect(embed.title).toContain('[DEV]');
      expect(embed.title).toContain('500');
      expect(embed.color).toBe(0xb91c1c);
      expect(embed.footer?.text).toBe('OddsCast DEV');
    });

    it('DevClientError should produce correct embed', () => {
      const notification = new DevClientError(
        'POST',
        '/api/login',
        429,
        'Too many requests',
        '1.2.3.4',
      );
      const embed = notification.toEmbed();
      expect(embed.title).toContain('[DEV]');
      expect(embed.title).toContain('429');
      expect(embed.color).toBe(0xea580c);
    });

    it('DevSignupNotification should produce correct embed', () => {
      const notification = new DevSignupNotification('user@test.com', 'Nick');
      const embed = notification.toEmbed();
      expect(embed.title).toContain('[DEV]');
      expect(embed.color).toBe(0x16a34a);
    });
  });
});
