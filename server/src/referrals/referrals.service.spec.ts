import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ReferralsService } from './referrals.service';
import { ReferralCode } from '../database/entities/referral-code.entity';
import { ReferralClaim } from '../database/entities/referral-claim.entity';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';

const mockCodeRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  increment: jest.fn(),
};

const mockClaimRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockTicketsService = {
  grantTickets: jest.fn(),
};

describe('ReferralsService', () => {
  let service: ReferralsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: getRepositoryToken(ReferralCode), useValue: mockCodeRepo },
        { provide: getRepositoryToken(ReferralClaim), useValue: mockClaimRepo },
        { provide: PredictionTicketsService, useValue: mockTicketsService },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------------------
  // getMyReferral
  // -------------------------------------------------------------------
  describe('getMyReferral', () => {
    it('returns existing referral code if found', async () => {
      const existing: Partial<ReferralCode> = {
        code: 'ABCD1234',
        usedCount: 2,
        maxUses: 10,
      };
      mockCodeRepo.findOne.mockResolvedValue(existing);

      const result = await service.getMyReferral(1);

      expect(result).toEqual({
        code: 'ABCD1234',
        usedCount: 2,
        maxUses: 10,
        remainingUses: 8,
      });
      expect(mockCodeRepo.save).not.toHaveBeenCalled();
    });

    it('creates and returns a new referral code when none exists', async () => {
      mockCodeRepo.findOne.mockResolvedValue(null);
      const created: Partial<ReferralCode> = {
        code: 'NEW12345',
        usedCount: 0,
        maxUses: 10,
      };
      mockCodeRepo.create.mockReturnValue(created);
      mockCodeRepo.save.mockResolvedValue(created);

      const result = await service.getMyReferral(42);

      expect(mockCodeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 42 }),
      );
      expect(mockCodeRepo.save).toHaveBeenCalled();
      expect(result.code).toBe('NEW12345');
      expect(result.remainingUses).toBe(10);
    });

    it('retries on unique constraint violation and succeeds', async () => {
      mockCodeRepo.findOne.mockResolvedValue(null);
      const uniqueErr = Object.assign(
        new QueryFailedError('', [], new Error()),
        { code: '23505' },
      );
      const created: Partial<ReferralCode> = {
        code: 'RETRY123',
        usedCount: 0,
        maxUses: 10,
      };
      mockCodeRepo.create.mockReturnValue(created);
      mockCodeRepo.save
        .mockRejectedValueOnce(uniqueErr)
        .mockResolvedValueOnce(created);

      const result = await service.getMyReferral(5);

      expect(mockCodeRepo.save).toHaveBeenCalledTimes(2);
      expect(result.code).toBe('RETRY123');
    });
  });

  // -------------------------------------------------------------------
  // claimCode
  // -------------------------------------------------------------------
  describe('claimCode', () => {
    const validCode: Partial<ReferralCode> = {
      id: 1,
      userId: 99,
      code: 'VALID001',
      usedCount: 0,
      maxUses: 10,
    };

    it('grants tickets and returns success', async () => {
      mockClaimRepo.findOne.mockResolvedValue(null);
      mockCodeRepo.findOne.mockResolvedValue(validCode);
      mockClaimRepo.create.mockReturnValue({});
      mockClaimRepo.save.mockResolvedValue({});
      mockCodeRepo.increment.mockResolvedValue({ affected: 1 });
      mockTicketsService.grantTickets.mockResolvedValue(undefined);

      const result = await service.claimCode(7, 'valid001');

      expect(result).toEqual({ success: true, ticketsGranted: 2 });
      expect(mockTicketsService.grantTickets).toHaveBeenCalledTimes(2);
      // referred user gets 2
      expect(mockTicketsService.grantTickets).toHaveBeenCalledWith(
        7,
        2,
        30,
        'RACE',
      );
      // referrer gets 3
      expect(mockTicketsService.grantTickets).toHaveBeenCalledWith(
        99,
        3,
        30,
        'RACE',
      );
      expect(mockCodeRepo.increment).toHaveBeenCalledWith(
        { id: 1 },
        'usedCount',
        1,
      );
    });

    it('normalises the code to uppercase before looking up', async () => {
      mockClaimRepo.findOne.mockResolvedValue(null);
      mockCodeRepo.findOne.mockResolvedValue(validCode);
      mockClaimRepo.create.mockReturnValue({});
      mockClaimRepo.save.mockResolvedValue({});
      mockCodeRepo.increment.mockResolvedValue({});
      mockTicketsService.grantTickets.mockResolvedValue(undefined);

      await service.claimCode(7, 'valid001');

      expect(mockCodeRepo.findOne).toHaveBeenCalledWith({
        where: { code: 'VALID001' },
      });
    });

    it('throws ConflictException when user already claimed', async () => {
      mockClaimRepo.findOne.mockResolvedValue({ id: 5 });

      await expect(service.claimCode(7, 'VALID001')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws BadRequestException for unknown code', async () => {
      mockClaimRepo.findOne.mockResolvedValue(null);
      mockCodeRepo.findOne.mockResolvedValue(null);

      await expect(service.claimCode(7, 'BADCODE')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when user tries to use their own code', async () => {
      mockClaimRepo.findOne.mockResolvedValue(null);
      mockCodeRepo.findOne.mockResolvedValue({ ...validCode, userId: 7 });

      await expect(service.claimCode(7, 'VALID001')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when code is exhausted', async () => {
      mockClaimRepo.findOne.mockResolvedValue(null);
      mockCodeRepo.findOne.mockResolvedValue({
        ...validCode,
        usedCount: 10,
        maxUses: 10,
      });

      await expect(service.claimCode(7, 'VALID001')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
