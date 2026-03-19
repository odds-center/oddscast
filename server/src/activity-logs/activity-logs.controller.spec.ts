import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { Request } from 'express';

const mockActivityLogsService = {
  logUserActivity: jest.fn(),
  logUserActivities: jest.fn(),
};

function createMockRequest(overrides?: Partial<Request>): Request {
  return {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
      authorization: undefined,
      ...overrides?.headers,
    },
    ...overrides,
  } as unknown as Request;
}

describe('ActivityLogsController', () => {
  let controller: ActivityLogsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogsController],
      providers: [
        {
          provide: ActivityLogsService,
          useValue: mockActivityLogsService,
        },
      ],
    }).compile();

    controller = module.get<ActivityLogsController>(ActivityLogsController);
  });

  describe('trackEvent', () => {
    it('should log a single activity event', async () => {
      const body = {
        event: 'page_view',
        page: '/races',
        sessionId: 'sess-1',
      };
      const req = createMockRequest();
      mockActivityLogsService.logUserActivity.mockResolvedValue(undefined);

      await controller.trackEvent(body, req);

      expect(mockActivityLogsService.logUserActivity).toHaveBeenCalledWith({
        userId: undefined,
        sessionId: 'sess-1',
        event: 'page_view',
        page: '/races',
        target: undefined,
        metadata: undefined,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should extract userId from JWT token in authorization header', async () => {
      // Create a valid JWT-like token with sub=42
      const payload = Buffer.from(JSON.stringify({ sub: 42 })).toString(
        'base64',
      );
      const fakeToken = `header.${payload}.signature`;
      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${fakeToken}`,
          'user-agent': 'test-agent',
        },
      } as Partial<Request>);
      const body = { event: 'click', target: 'button' };
      mockActivityLogsService.logUserActivity.mockResolvedValue(undefined);

      await controller.trackEvent(body, req);

      expect(mockActivityLogsService.logUserActivity).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 42 }),
      );
    });
  });

  describe('trackBatch', () => {
    it('should log multiple activity events', async () => {
      const body = {
        events: [
          { event: 'page_view', page: '/races' },
          { event: 'click', target: 'race-card', page: '/races' },
        ],
      };
      const req = createMockRequest();
      mockActivityLogsService.logUserActivities.mockResolvedValue(undefined);

      await controller.trackBatch(body, req);

      expect(mockActivityLogsService.logUserActivities).toHaveBeenCalledWith([
        {
          userId: undefined,
          sessionId: undefined,
          event: 'page_view',
          page: '/races',
          target: undefined,
          metadata: undefined,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
        {
          userId: undefined,
          sessionId: undefined,
          event: 'click',
          page: '/races',
          target: 'race-card',
          metadata: undefined,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      ]);
    });
  });
});
