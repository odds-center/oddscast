import { Test, TestingModule } from '@nestjs/testing';
import { AdminResultsController } from './admin-results.controller';
import { ResultsService } from '../results/results.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockResultsService = {
  findAll: jest.fn(),
  getStatistics: jest.fn(),
  getByRace: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  bulkCreate: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('AdminResultsController', () => {
  let controller: AdminResultsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminResultsController],
      providers: [{ provide: ResultsService, useValue: mockResultsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminResultsController>(AdminResultsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to resultsService.findAll with filters', async () => {
      const expected = { data: [], total: 0 };
      mockResultsService.findAll.mockResolvedValue(expected);
      const filters = { rcDate: '20250301' } as never;

      const result = await controller.findAll(filters);

      expect(mockResultsService.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expected);
    });
  });

  describe('getStatistics', () => {
    it('should delegate to resultsService.getStatistics', async () => {
      const expected = { totalResults: 100 };
      mockResultsService.getStatistics.mockResolvedValue(expected);
      const filters = {} as never;

      const result = await controller.getStatistics(filters);

      expect(mockResultsService.getStatistics).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expected);
    });
  });

  describe('getByRace', () => {
    it('should delegate to resultsService.getByRace', async () => {
      const expected = [{ id: '1', ord: 1, hrName: 'Horse A' }];
      mockResultsService.getByRace.mockResolvedValue(expected);

      const result = await controller.getByRace(42);

      expect(mockResultsService.getByRace).toHaveBeenCalledWith(42);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to resultsService.findOne', async () => {
      const expected = { id: 1, ord: 1 };
      mockResultsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(mockResultsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('create', () => {
    it('should delegate to resultsService.create', async () => {
      const dto = {
        raceId: 1,
        ord: 1,
        hrNo: '100',
        hrName: 'Horse A',
      } as never;
      const expected = {
        id: '1',
        raceId: 1,
        ord: 1,
        hrNo: '100',
        hrName: 'Horse A',
      };
      mockResultsService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(mockResultsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('bulkCreate', () => {
    it('should delegate to resultsService.bulkCreate', async () => {
      const dto = {
        raceId: 1,
        results: [{ ord: 1, hrNo: '100', hrName: 'A' }],
      } as never;
      const expected = { created: 1 };
      mockResultsService.bulkCreate.mockResolvedValue(expected);

      const result = await controller.bulkCreate(dto);

      expect(mockResultsService.bulkCreate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should delegate to resultsService.update', async () => {
      const dto = { ord: 2 } as never;
      const expected = { id: 1, ord: 2 };
      mockResultsService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto);

      expect(mockResultsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should delegate to resultsService.remove', async () => {
      mockResultsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(mockResultsService.remove).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });
});
