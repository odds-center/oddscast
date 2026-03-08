import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DiscordService } from './discord.service';
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
      ...envOverrides,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: string) => defaults[key] ?? fallback),
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
            expect.objectContaining({ title: expect.stringContaining('회원가입') }),
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
      await service.notifyError('POST', '/api/test', 500, 'Server error', 'Error: stack...');

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
      // Should not throw
      await expect(
        service.notifyError('GET', '/api/test', 503, 'timeout'),
      ).resolves.toBeUndefined();
    });
  });
});
