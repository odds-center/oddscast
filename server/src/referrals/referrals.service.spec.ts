import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReferralsService } from './referrals.service';
import { ReferralCode } from '../database/entities/referral-code.entity';
import { ReferralClaim } from '../database/entities/referral-claim.entity';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { createMockRepository } from '../test/mock-factories';

const mockTicketsService = {
  grantTickets: jest.fn().mockResolvedValue(undefined),
};

describe('ReferralsService', () => {
  let service: ReferralsService;
  let referralCodeRepo: ReturnType<typeof createMockRepository>;
  let referralClaimRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    referralCodeRepo = createMockRepository();
    referralClaimRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        {
          provide: getRepositoryToken(ReferralCode),
          useValue: referralCodeRepo,
        },
        {
          provide: getRepositoryToken(ReferralClaim),
          useValue: referralClaimRepo,
        },
        { provide: PredictionTicketsService, useValue: mockTicketsService },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
    jest.clearAllMocks();
  });

  describe('getOrCreateMyCode', () => {
    it('returns existing code without creating new one', async () => {
      const existingCode = {
        id: 1,
        code: 'ABCD1234',
        usedCount: 2,
        maxUses: 10,
      };
      referralCodeRepo.findOne.mockResolvedValue(existingCode);

      const result = await service.getOrCreateMyCode(1);
      expect(result.code).toBe('ABCD1234');
      expect(result.usedCount).toBe(2);
      expect(result.maxUses).toBe(10);
      expect(referralCodeRepo.save).not.toHaveBeenCalled();
    });

    it('creates new code when none exists', async () => {
      referralCodeRepo.findOne
        .mockResolvedValueOnce(null) // no existing code for user
        .mockResolvedValueOnce(null); // candidate code doesn't exist
      const created = { id: 2, code: 'NEWCODE1', usedCount: 0, maxUses: 10 };
      referralCodeRepo.create.mockReturnValue(created);
      referralCodeRepo.save.mockResolvedValue(created);

      const result = await service.getOrCreateMyCode(1);
      expect(referralCodeRepo.save).toHaveBeenCalled();
      expect(result.usedCount).toBe(0);
      expect(result.maxUses).toBe(10);
    });

    it('returns 8-char uppercase code', async () => {
      referralCodeRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      const created = { id: 2, code: 'ABCDEFGH', usedCount: 0, maxUses: 10 };
      referralCodeRepo.create.mockReturnValue(created);
      referralCodeRepo.save.mockResolvedValue(created);

      const result = await service.getOrCreateMyCode(2);
      expect(result.code).toHaveLength(8);
    });
  });

  describe('claim', () => {
    const referral = {
      id: 10,
      userId: 99, // referrer user
      code: 'VALID123',
      usedCount: 2,
      maxUses: 10,
    };

    it('throws NotFoundException when code not found', async () => {
      referralCodeRepo.findOne.mockResolvedValue(null);

      await expect(service.claim(1, 'INVALID1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when claiming own code', async () => {
      referralCodeRepo.findOne.mockResolvedValue({ ...referral, userId: 1 }); // same user

      await expect(service.claim(1, 'VALID123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when code is at max uses', async () => {
      referralCodeRepo.findOne.mockResolvedValue({
        ...referral,
        usedCount: 10,
        maxUses: 10,
      });

      await expect(service.claim(2, 'VALID123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when user already claimed a code', async () => {
      referralCodeRepo.findOne.mockResolvedValue(referral);
      referralClaimRepo.findOne.mockResolvedValue({ id: 5 }); // existing claim

      await expect(service.claim(2, 'VALID123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('grants tickets to both referrer and referred on success', async () => {
      referralCodeRepo.findOne.mockResolvedValue(referral);
      referralClaimRepo.findOne.mockResolvedValue(null); // no existing claim
      referralClaimRepo.create.mockReturnValue({});
      referralClaimRepo.save.mockResolvedValue({});
      referralCodeRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.claim(2, 'VALID123');
      expect(result.message).toContain('예측권이 지급');
      expect(mockTicketsService.grantTickets).toHaveBeenCalledTimes(2);
      // Referred user gets 2 tickets, referrer gets 3
      expect(mockTicketsService.grantTickets).toHaveBeenCalledWith(
        2,
        2,
        30,
        'RACE',
      ); // referred
      expect(mockTicketsService.grantTickets).toHaveBeenCalledWith(
        99,
        3,
        30,
        'RACE',
      ); // referrer
    });

    it('increments usedCount by 1 after claim', async () => {
      referralCodeRepo.findOne.mockResolvedValue(referral);
      referralClaimRepo.findOne.mockResolvedValue(null);
      referralClaimRepo.create.mockReturnValue({});
      referralClaimRepo.save.mockResolvedValue({});
      referralCodeRepo.update.mockResolvedValue({ affected: 1 });

      await service.claim(2, 'VALID123');
      expect(referralCodeRepo.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ usedCount: 3 }), // 2 + 1
      );
    });

    it('normalizes code to uppercase before lookup', async () => {
      referralCodeRepo.findOne.mockResolvedValue(null);

      await expect(service.claim(1, 'valid123')).rejects.toThrow(
        NotFoundException,
      );
      expect(referralCodeRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: 'VALID123' } }),
      );
    });
  });
});
