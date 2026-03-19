import { Test, TestingModule } from '@nestjs/testing';
import { AdminRacesController } from './admin-races.controller';
import { RacesService } from '../races/races.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockRacesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

describe('AdminRacesController', () => {
  let controller: AdminRacesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRacesController],
      providers: [{ provide: RacesService, useValue: mockRacesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminRacesController>(AdminRacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to racesService.findAll with filters', async () => {
      const expected = { races: [], total: 0, page: 1, totalPages: 0 };
      mockRacesService.findAll.mockResolvedValue(expected);
      const filters = { meet: 'SEOUL', rcDate: '20250301' };

      const result = await controller.findAll(filters);

      expect(mockRacesService.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to racesService.findOne', async () => {
      const expected = { id: 1, meet: 'SEOUL', rcNo: 1 };
      mockRacesService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(mockRacesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should delegate to racesService.update', async () => {
      const dto = { rcName: 'Updated Race' } as never;
      const expected = { id: 1, rcName: 'Updated Race' };
      mockRacesService.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto);

      expect(mockRacesService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expected);
    });
  });
});
