import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RacesController } from './races.controller';
import { RacesService } from './races.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createTestRace } from '../test/test-entities';
import { RaceStatus } from '../database/db-enums';

const mockRacesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  getTodayRaces: jest.fn(),
  getRacesByDate: jest.fn(),
  getSchedule: jest.fn(),
  getScheduleDates: jest.fn(),
  getStatistics: jest.fn(),
  getRaceResult: jest.fn(),
  getDividends: jest.fn(),
  getAnalysis: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  createEntry: jest.fn(),
  createBulkEntries: jest.fn(),
};

describe('RacesController', () => {
  let controller: RacesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RacesController],
      providers: [{ provide: RacesService, useValue: mockRacesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RacesController>(RacesController);
  });

  describe('findAll', () => {
    it('should return paginated races from service', async () => {
      const race = createTestRace();
      const expected = { races: [race], total: 1, page: 1, totalPages: 1 };
      mockRacesService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll({ page: 1, limit: 20 } as never);

      expect(mockRacesService.findAll).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('getTodayRaces', () => {
    it('should return today races from service', async () => {
      const races = [createTestRace()];
      mockRacesService.getTodayRaces.mockResolvedValue(races);

      const result = await controller.getTodayRaces();

      expect(mockRacesService.getTodayRaces).toHaveBeenCalled();
      expect(result).toBe(races);
    });
  });

  describe('getRacesByDate', () => {
    it('should delegate date string to service', async () => {
      const races = [createTestRace()];
      mockRacesService.getRacesByDate.mockResolvedValue(races);

      const result = await controller.getRacesByDate('20250301');

      expect(mockRacesService.getRacesByDate).toHaveBeenCalledWith('20250301');
      expect(result).toBe(races);
    });
  });

  describe('getSchedule', () => {
    it('should pass query params to service', async () => {
      const schedule = [createTestRace()];
      mockRacesService.getSchedule.mockResolvedValue(schedule);

      const result = await controller.getSchedule(
        '20250301',
        '20250331',
        'SEOUL',
      );

      expect(mockRacesService.getSchedule).toHaveBeenCalledWith({
        dateFrom: '20250301',
        dateTo: '20250331',
        meet: 'SEOUL',
      });
      expect(result).toBe(schedule);
    });

    it('should pass undefined params when not provided', async () => {
      mockRacesService.getSchedule.mockResolvedValue([]);

      await controller.getSchedule();

      expect(mockRacesService.getSchedule).toHaveBeenCalledWith({
        dateFrom: undefined,
        dateTo: undefined,
        meet: undefined,
      });
    });
  });

  describe('getCalendar', () => {
    it('should compute dateFrom/dateTo from year and month', async () => {
      mockRacesService.getSchedule.mockResolvedValue([]);

      await controller.getCalendar(2025, 3);

      expect(mockRacesService.getSchedule).toHaveBeenCalledWith({
        dateFrom: '20250301',
        dateTo: '20250331',
      });
    });

    it('should pass undefined range when year/month not provided', async () => {
      mockRacesService.getSchedule.mockResolvedValue([]);

      await controller.getCalendar();

      expect(mockRacesService.getSchedule).toHaveBeenCalledWith({
        dateFrom: undefined,
        dateTo: undefined,
      });
    });
  });

  describe('search', () => {
    it('should pass search params to findAll', async () => {
      const expected = { races: [], total: 0, page: 1, totalPages: 0 };
      mockRacesService.findAll.mockResolvedValue(expected);

      await controller.search(
        'Test',
        'SEOUL',
        undefined,
        undefined,
        'SCHEDULED',
        1,
        20,
      );

      expect(mockRacesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'Test',
          meet: 'SEOUL',
          status: 'SCHEDULED',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return race detail by id', async () => {
      const race = createTestRace({ id: 5 });
      mockRacesService.findOne.mockResolvedValue(race);

      const result = await controller.findOne(5);

      expect(mockRacesService.findOne).toHaveBeenCalledWith(5);
      expect(result).toBe(race);
    });

    it('should propagate NotFoundException from service', async () => {
      mockRacesService.findOne.mockRejectedValue(
        new NotFoundException('Race not found'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRaceResults / getRaceResult', () => {
    it('getRaceResults should delegate to service.getRaceResult', async () => {
      const results = [{ id: 1, ord: '1' }];
      mockRacesService.getRaceResult.mockResolvedValue(results);

      const result = await controller.getRaceResults(1);

      expect(mockRacesService.getRaceResult).toHaveBeenCalledWith(1);
      expect(result).toBe(results);
    });

    it('getRaceResult (singular) should also delegate to service.getRaceResult', async () => {
      const results = [{ id: 1, ord: '1' }];
      mockRacesService.getRaceResult.mockResolvedValue(results);

      const result = await controller.getRaceResult(1);

      expect(mockRacesService.getRaceResult).toHaveBeenCalledWith(1);
      expect(result).toBe(results);
    });
  });

  describe('getEntries', () => {
    it('should delegate to service.findOne', async () => {
      const race = createTestRace();
      mockRacesService.findOne.mockResolvedValue(race);

      const result = await controller.getEntries(1);

      expect(mockRacesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(race);
    });
  });

  describe('getDividends', () => {
    it('should delegate to service.getDividends', async () => {
      const dividends = [{ id: 1, pool: 'WIN', odds: 3.5 }];
      mockRacesService.getDividends.mockResolvedValue(dividends);

      const result = await controller.getDividends(1);

      expect(mockRacesService.getDividends).toHaveBeenCalledWith(1);
      expect(result).toBe(dividends);
    });
  });

  describe('getAnalysis', () => {
    it('should delegate to service.getAnalysis', async () => {
      const analysis = { prediction: { scores: {} } };
      mockRacesService.getAnalysis.mockResolvedValue(analysis);

      const result = await controller.getAnalysis(1);

      expect(mockRacesService.getAnalysis).toHaveBeenCalledWith(1);
      expect(result).toBe(analysis);
    });
  });

  describe('create', () => {
    it('should delegate to service.create', async () => {
      const dto = { meet: '서울', rcDate: '20250301', rcNo: '1' };
      const created = createTestRace({ status: RaceStatus.SCHEDULED });
      mockRacesService.create.mockResolvedValue(created);

      const result = await controller.create(dto as never);

      expect(mockRacesService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('should delegate to service.update with id and dto', async () => {
      const dto = { rcName: 'Updated Race' };
      const updated = createTestRace({ rcName: 'Updated Race' });
      mockRacesService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto as never);

      expect(mockRacesService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('should delegate to service.remove', async () => {
      mockRacesService.remove.mockResolvedValue({ affected: 1 });

      const result = await controller.remove(1);

      expect(mockRacesService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ affected: 1 });
    });
  });

  describe('createEntry', () => {
    it('should delegate to service.createEntry with raceId and dto', async () => {
      const dto = { hrNo: '1', hrName: 'Thunder', jkName: 'Kim' };
      const entry = { id: 'entry-1', raceId: 1, ...dto };
      mockRacesService.createEntry.mockResolvedValue(entry);

      const result = await controller.createEntry(1, dto as never);

      expect(mockRacesService.createEntry).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(entry);
    });
  });

  describe('createBulkEntries', () => {
    it('should delegate to service.createBulkEntries with raceId and entries array', async () => {
      const entries = [{ hrNo: '1', hrName: 'Thunder', jkName: 'Kim' }];
      const created = [{ id: 'entry-1', raceId: 1 }];
      mockRacesService.createBulkEntries.mockResolvedValue(created);

      const result = await controller.createBulkEntries(1, {
        entries,
      } as never);

      expect(mockRacesService.createBulkEntries).toHaveBeenCalledWith(
        1,
        entries,
      );
      expect(result).toBe(created);
    });
  });
});
