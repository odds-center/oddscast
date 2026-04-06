import { Test, TestingModule } from '@nestjs/testing';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockResultsService = {
  findAll: jest.fn(),
  getStatistics: jest.fn(),
  exportResults: jest.fn(),
  search: jest.fn(),
  validateByRaceId: jest.fn(),
  getByRace: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  bulkCreate: jest.fn(),
  bulkUpdate: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ResultsController', () => {
  let controller: ResultsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [{ provide: ResultsService, useValue: mockResultsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ResultsController>(ResultsController);
  });

  describe('findAll', () => {
    it('should delegate to service.findAll with filters', async () => {
      const filters = { page: 1, limit: 20 };
      const expected = { data: [], total: 0 };
      mockResultsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(filters as never);

      expect(mockResultsService.findAll).toHaveBeenCalledWith(filters);
      expect(result).toBe(expected);
    });
  });

  describe('getStatistics', () => {
    it('should delegate to service.getStatistics with filters', async () => {
      const filters = { meet: 'SEOUL' };
      const expected = { totalRaces: 50 };
      mockResultsService.getStatistics.mockResolvedValue(expected);

      const result = await controller.getStatistics(filters as never);

      expect(mockResultsService.getStatistics).toHaveBeenCalledWith(filters);
      expect(result).toBe(expected);
    });
  });

  describe('exportResults', () => {
    it('should delegate to service.exportResults with format and filters', async () => {
      const filters = { meet: 'SEOUL' };
      const expected = [{ id: 1 }];
      mockResultsService.exportResults.mockResolvedValue(expected);

      const result = await controller.exportResults('json', filters as never);

      expect(mockResultsService.exportResults).toHaveBeenCalledWith(
        'json',
        filters,
      );
      expect(result).toBe(expected);
    });
  });

  describe('search', () => {
    it('should delegate to service.search with filters', async () => {
      const filters = { q: 'Thunder' };
      const expected = { data: [], total: 0 };
      mockResultsService.search.mockResolvedValue(expected);

      const result = await controller.search(filters as never);

      expect(mockResultsService.search).toHaveBeenCalledWith(filters);
      expect(result).toBe(expected);
    });
  });

  describe('validate', () => {
    it('should delegate to service.validateByRaceId with raceId', async () => {
      const expected = { valid: true };
      mockResultsService.validateByRaceId.mockResolvedValue(expected);

      const result = await controller.validate(1);

      expect(mockResultsService.validateByRaceId).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('getByRace', () => {
    it('should delegate to service.getByRace with raceId', async () => {
      const expected = [{ id: 1, ord: '1' }];
      mockResultsService.getByRace.mockResolvedValue(expected);

      const result = await controller.getByRace(1);

      expect(mockResultsService.getByRace).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne with id', async () => {
      const expected = { id: 1, ord: '1', hrName: 'Thunder' };
      mockResultsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(mockResultsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('create', () => {
    it('should delegate to service.create with dto', async () => {
      const dto = { raceId: 1, ord: '1', hrNo: '101' };
      const expected = { id: 1, ...dto };
      mockResultsService.create.mockResolvedValue(expected);

      const result = await controller.create(dto as never);

      expect(mockResultsService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('bulkCreate', () => {
    it('should delegate to service.bulkCreate with dto', async () => {
      const dto = { raceId: 1, results: [{ ord: '1', hrNo: '101' }] };
      const expected = { created: 1 };
      mockResultsService.bulkCreate.mockResolvedValue(expected);

      const result = await controller.bulkCreate(dto as never);

      expect(mockResultsService.bulkCreate).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('bulkUpdate', () => {
    it('should delegate to service.bulkUpdate with dto', async () => {
      const dto = { results: [{ id: 1, ord: '2' }] };
      const expected = { updated: 1 };
      mockResultsService.bulkUpdate.mockResolvedValue(expected);

      const result = await controller.bulkUpdate(dto as never);

      expect(mockResultsService.bulkUpdate).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('update', () => {
    it('should delegate to service.update with id and dto', async () => {
      const dto = { ord: '2' };
      const expected = { id: 1, ord: '2' };
      mockResultsService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto as never);

      expect(mockResultsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe('remove', () => {
    it('should delegate to service.remove with id', async () => {
      const expected = { affected: 1 };
      mockResultsService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(mockResultsService.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });
});
