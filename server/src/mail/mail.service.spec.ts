import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

// Mock resend before importing
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

describe('MailService', () => {
  let service: MailService;
  let mockSend: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: string) => {
              if (key === 'RESEND_API_KEY') return 'test-api-key';
              if (key === 'MAIL_FROM') return 'OddsCast <test@test.com>';
              return fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    // Access the mock send function
    mockSend = (service as unknown as { resend: { emails: { send: jest.Mock } } }).resend.emails.send;
  });

  describe('sendVerificationCode', () => {
    it('should send verification email successfully', async () => {
      mockSend.mockResolvedValue({ error: null });

      const result = await service.sendVerificationCode('user@test.com', '123456');

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('인증'),
          html: expect.stringContaining('123456'),
        }),
      );
    });

    it('should return error when Resend API fails', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Invalid API key' } });

      const result = await service.sendVerificationCode('user@test.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should handle thrown exceptions', async () => {
      mockSend.mockRejectedValue(new Error('Network timeout'));

      const result = await service.sendVerificationCode('user@test.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });
  });
});
