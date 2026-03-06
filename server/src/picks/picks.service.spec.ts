import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PicksService } from './picks.service';
import { UserPick } from '../database/entities/user-pick.entity';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { PickType } from '../database/db-enums';
import { createMockRepository } from '../test/mock-factories';
import { createTestRace } from '../test/test-entities';

describe('PicksService', () => {
  let service: PicksService;
  let userPickRepo: ReturnType<typeof createMockRepository>;
  let raceRepo: ReturnType<typeof createMockRepository>;
  let resultRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    userPickRepo = createMockRepository();
    raceRepo = createMockRepository();
    resultRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PicksService,
        { provide: getRepositoryToken(UserPick), useValue: userPickRepo },
        { provide: getRepositoryToken(Race), useValue: raceRepo },
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
      ],
    }).compile();

    service = module.get<PicksService>(PicksService);
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // checkPickHit — pure business logic, no DB interaction
  // ------------------------------------------------------------------
  describe('checkPickHit', () => {
    const results = [
      { hrNo: 'H1', ord: '1' },
      { hrNo: 'H2', ord: '2' },
      { hrNo: 'H3', ord: '3' },
      { hrNo: 'H4', ord: '4' },
    ];

    describe('SINGLE', () => {
      it('returns true when 1st place horse matches', () => {
        expect(service.checkPickHit(PickType.SINGLE, ['H1'], results)).toBe(
          true,
        );
      });

      it('returns false when 2nd place horse selected', () => {
        expect(service.checkPickHit(PickType.SINGLE, ['H2'], results)).toBe(
          false,
        );
      });

      it('returns false when no results', () => {
        expect(service.checkPickHit(PickType.SINGLE, ['H1'], [])).toBe(false);
      });
    });

    describe('PLACE', () => {
      it('returns true for any top-3 horse', () => {
        expect(service.checkPickHit(PickType.PLACE, ['H1'], results)).toBe(
          true,
        );
        expect(service.checkPickHit(PickType.PLACE, ['H2'], results)).toBe(
          true,
        );
        expect(service.checkPickHit(PickType.PLACE, ['H3'], results)).toBe(
          true,
        );
      });

      it('returns false for 4th place', () => {
        expect(service.checkPickHit(PickType.PLACE, ['H4'], results)).toBe(
          false,
        );
      });
    });

    describe('QUINELLA', () => {
      it('returns true when both top-2 selected regardless of order', () => {
        expect(
          service.checkPickHit(PickType.QUINELLA, ['H1', 'H2'], results),
        ).toBe(true);
        expect(
          service.checkPickHit(PickType.QUINELLA, ['H2', 'H1'], results),
        ).toBe(true);
      });

      it('returns false when wrong horses selected', () => {
        expect(
          service.checkPickHit(PickType.QUINELLA, ['H1', 'H3'], results),
        ).toBe(false);
      });
    });

    describe('EXACTA', () => {
      it('returns true for exact 1st and 2nd place in order', () => {
        expect(
          service.checkPickHit(PickType.EXACTA, ['H1', 'H2'], results),
        ).toBe(true);
      });

      it('returns false when order is reversed', () => {
        expect(
          service.checkPickHit(PickType.EXACTA, ['H2', 'H1'], results),
        ).toBe(false);
      });

      it('returns false when wrong horse selected for 1st', () => {
        expect(
          service.checkPickHit(PickType.EXACTA, ['H2', 'H2'], results),
        ).toBe(false);
      });
    });

    describe('QUINELLA_PLACE', () => {
      it('returns true when both selected horses are in top 3', () => {
        expect(
          service.checkPickHit(PickType.QUINELLA_PLACE, ['H1', 'H3'], results),
        ).toBe(true);
        expect(
          service.checkPickHit(PickType.QUINELLA_PLACE, ['H2', 'H3'], results),
        ).toBe(true);
      });

      it('returns false when one horse is not in top 3', () => {
        expect(
          service.checkPickHit(PickType.QUINELLA_PLACE, ['H1', 'H4'], results),
        ).toBe(false);
      });
    });

    describe('TRIFECTA', () => {
      it('returns true when all top 3 selected (any order)', () => {
        expect(
          service.checkPickHit(PickType.TRIFECTA, ['H3', 'H1', 'H2'], results),
        ).toBe(true);
      });

      it('returns false when one wrong horse', () => {
        expect(
          service.checkPickHit(PickType.TRIFECTA, ['H1', 'H2', 'H4'], results),
        ).toBe(false);
      });
    });

    describe('TRIPLE', () => {
      it('returns true for exact 1st, 2nd, 3rd in order', () => {
        expect(
          service.checkPickHit(PickType.TRIPLE, ['H1', 'H2', 'H3'], results),
        ).toBe(true);
      });

      it('returns false when order is wrong', () => {
        expect(
          service.checkPickHit(PickType.TRIPLE, ['H1', 'H3', 'H2'], results),
        ).toBe(false);
      });

      it('returns false when missing top 3 results', () => {
        const twoResults = [
          { hrNo: 'H1', ord: '1' },
          { hrNo: 'H2', ord: '2' },
        ];
        expect(
          service.checkPickHit(PickType.TRIPLE, ['H1', 'H2', 'H3'], twoResults),
        ).toBe(false);
      });
    });
  });

  // ------------------------------------------------------------------
  // create
  // ------------------------------------------------------------------
  describe('create', () => {
    it('throws NotFoundException when race not found', async () => {
      raceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(1, {
          raceId: 999,
          pickType: PickType.SINGLE,
          hrNos: ['H1'],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when wrong number of horses', async () => {
      raceRepo.findOne.mockResolvedValue(createTestRace());

      await expect(
        service.create(1, {
          raceId: 1,
          pickType: PickType.QUINELLA,
          hrNos: ['H1'],
        }), // QUINELLA needs 2
      ).rejects.toThrow(BadRequestException);
    });

    it('updates existing pick instead of creating duplicate', async () => {
      raceRepo.findOne.mockResolvedValue(createTestRace());
      const existingPick = {
        id: 'pick-1',
        userId: 1,
        raceId: 1,
        pickType: PickType.SINGLE,
        hrNos: ['H1'],
      };
      userPickRepo.findOne
        .mockResolvedValueOnce(existingPick)
        .mockResolvedValueOnce({ ...existingPick, race: createTestRace() });
      userPickRepo.save.mockResolvedValue(existingPick);

      await service.create(1, {
        raceId: 1,
        pickType: PickType.SINGLE,
        hrNos: ['H2'],
      });
      expect(userPickRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ hrNos: ['H2'] }),
      );
    });
  });

  // ------------------------------------------------------------------
  // findByUser
  // ------------------------------------------------------------------
  describe('findByUser', () => {
    it('returns paginated picks for user', async () => {
      const mockPick = {
        userId: 1,
        raceId: 1,
        pickType: PickType.SINGLE,
        hrNos: ['H1'],
        race: {
          id: 1,
          meet: '서울',
          rcDate: '20250301',
          rcNo: '1',
          rcName: 'Test',
        },
      };
      userPickRepo.findAndCount.mockResolvedValue([[mockPick], 1]);

      const result = await service.findByUser(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  // ------------------------------------------------------------------
  // delete
  // ------------------------------------------------------------------
  describe('delete', () => {
    it('deletes existing pick', async () => {
      const existing = { id: 'pick-1' };
      userPickRepo.findOne.mockResolvedValue(existing);
      userPickRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(1, 1);
      expect(result.message).toBe('삭제되었습니다');
      expect(userPickRepo.delete).toHaveBeenCalledWith('pick-1');
    });

    it('throws NotFoundException when pick not found', async () => {
      userPickRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
