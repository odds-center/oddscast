import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { Race } from '../database/entities/race.entity';
import { NotificationsService } from './notifications.service';
import { GlobalConfigService } from '../config/config.service';
import { RaceStatus } from '../database/db-enums';

const mockRaceRepo = {
  findOne: jest.fn(),
};

const mockNotificationsService = {
  notifyFirstRaceSoon: jest.fn(),
};

const mockConfig = {
  get: jest.fn(),
  set: jest.fn(),
};

/** Build a fake race starting at hh:mm KST relative to now + offsetMinutes. */
function buildRace(offsetMinutes: number): Partial<Race> {
  const start = new Date(Date.now() + offsetMinutes * 60 * 1000);
  // Format stTime as HH:mm
  const h = String(start.getHours()).padStart(2, '0');
  const m = String(start.getMinutes()).padStart(2, '0');

  // rcDate YYYYMMDD matching local date of the start time (approximation for tests)
  const yyyy = String(start.getFullYear());
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');

  return {
    id: 1,
    rcDate: `${yyyy}${mm}${dd}`,
    meet: '서울',
    rcNo: '1',
    stTime: `${h}:${m}`,
    rcName: '봄 개막 특별경주',
    status: RaceStatus.SCHEDULED,
  };
}

describe('NotificationsSchedulerService', () => {
  let service: NotificationsSchedulerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsSchedulerService,
        { provide: getRepositoryToken(Race), useValue: mockRaceRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: GlobalConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<NotificationsSchedulerService>(
      NotificationsSchedulerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendFirstRaceReminderIfDue', () => {
    it('sends notification when first race is ~30 min away', async () => {
      mockConfig.get.mockResolvedValue(null);
      const race = buildRace(30); // 30 min from now
      mockRaceRepo.findOne.mockResolvedValue(race);
      mockNotificationsService.notifyFirstRaceSoon.mockResolvedValue(undefined);
      mockConfig.set.mockResolvedValue(undefined);

      await service.sendFirstRaceReminderIfDue();

      expect(mockNotificationsService.notifyFirstRaceSoon).toHaveBeenCalledWith(
        expect.objectContaining({ raceId: 1, meet: '서울' }),
      );
      expect(mockConfig.set).toHaveBeenCalled();
    });

    it('does not send if already sent today', async () => {
      mockConfig.get.mockResolvedValue('1');

      await service.sendFirstRaceReminderIfDue();

      expect(mockRaceRepo.findOne).not.toHaveBeenCalled();
      expect(
        mockNotificationsService.notifyFirstRaceSoon,
      ).not.toHaveBeenCalled();
    });

    it('does not send if no scheduled races today', async () => {
      mockConfig.get.mockResolvedValue(null);
      mockRaceRepo.findOne.mockResolvedValue(null);

      await service.sendFirstRaceReminderIfDue();

      expect(
        mockNotificationsService.notifyFirstRaceSoon,
      ).not.toHaveBeenCalled();
    });

    it('does not send if race is more than 35 min away', async () => {
      mockConfig.get.mockResolvedValue(null);
      mockRaceRepo.findOne.mockResolvedValue(buildRace(60)); // 60 min away

      await service.sendFirstRaceReminderIfDue();

      expect(
        mockNotificationsService.notifyFirstRaceSoon,
      ).not.toHaveBeenCalled();
    });

    it('does not send if race is less than 25 min away', async () => {
      mockConfig.get.mockResolvedValue(null);
      mockRaceRepo.findOne.mockResolvedValue(buildRace(10)); // 10 min away

      await service.sendFirstRaceReminderIfDue();

      expect(
        mockNotificationsService.notifyFirstRaceSoon,
      ).not.toHaveBeenCalled();
    });

    it('handles notification error gracefully without throwing', async () => {
      mockConfig.get.mockResolvedValue(null);
      mockRaceRepo.findOne.mockResolvedValue(buildRace(30));
      mockNotificationsService.notifyFirstRaceSoon.mockRejectedValue(
        new Error('FCM error'),
      );

      // Should not throw
      await expect(service.sendFirstRaceReminderIfDue()).resolves.not.toThrow();
    });

    it('skips when race has no stTime', async () => {
      mockConfig.get.mockResolvedValue(null);
      mockRaceRepo.findOne.mockResolvedValue({
        id: 2,
        rcDate: '20250301',
        stTime: null,
      });

      await service.sendFirstRaceReminderIfDue();

      expect(
        mockNotificationsService.notifyFirstRaceSoon,
      ).not.toHaveBeenCalled();
    });
  });
});
