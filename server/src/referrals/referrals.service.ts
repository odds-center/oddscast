import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { randomUUID } from 'crypto';
import { ReferralCode } from '../database/entities/referral-code.entity';
import { ReferralClaim } from '../database/entities/referral-claim.entity';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { GlobalConfigService } from '../config/config.service';

// Derive an 8-char uppercase hex code from a UUID (e.g. "A1B2C3D4")
function generateCode(): string {
  return randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
}

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(ReferralCode)
    private readonly referralCodeRepo: Repository<ReferralCode>,
    @InjectRepository(ReferralClaim)
    private readonly referralClaimRepo: Repository<ReferralClaim>,
    private readonly predictionTicketsService: PredictionTicketsService,
    private readonly globalConfig: GlobalConfigService,
  ) {}

  async getMyReferral(userId: number) {
    let referralCode = await this.referralCodeRepo.findOne({
      where: { userId },
    });
    if (!referralCode) {
      // Try to insert with a generated code; retry once on unique collision
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          referralCode = await this.referralCodeRepo.save(
            this.referralCodeRepo.create({
              userId,
              code: generateCode(),
              updatedAt: new Date(),
            }),
          );
          break;
        } catch (err: unknown) {
          const isUniqueViolation =
            err instanceof QueryFailedError &&
            (err as QueryFailedError & { code?: string }).code === '23505';
          if (!isUniqueViolation || attempt === 2) throw err;
        }
      }
      if (!referralCode) throw new Error('Failed to create referral code');
    }

    return {
      code: referralCode.code,
      usedCount: referralCode.usedCount,
      maxUses: referralCode.maxUses,
      remainingUses: referralCode.maxUses - referralCode.usedCount,
    };
  }

  async claimCode(referredUserId: number, code: string) {
    // Check if user already claimed any code
    const alreadyClaimed = await this.referralClaimRepo.findOne({
      where: { referredUserId },
    });
    if (alreadyClaimed) {
      throw new ConflictException('이미 추천 코드를 사용하셨습니다');
    }

    const referralCode = await this.referralCodeRepo.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!referralCode) {
      throw new BadRequestException('유효하지 않은 추천 코드입니다');
    }

    // Cannot use own code
    if (referralCode.userId === referredUserId) {
      throw new BadRequestException('본인의 추천 코드는 사용할 수 없습니다');
    }

    // Check max uses
    if (referralCode.usedCount >= referralCode.maxUses) {
      throw new BadRequestException('이미 최대 사용 횟수에 도달한 코드입니다');
    }

    // Create claim
    await this.referralClaimRepo.save(
      this.referralClaimRepo.create({
        referralCodeId: referralCode.id,
        referredUserId,
      }),
    );

    // Atomically increment usedCount via TypeORM
    await this.referralCodeRepo.increment(
      { id: referralCode.id },
      'usedCount',
      1,
    );

    const referredCount = parseInt(await this.globalConfig.get('referred_ticket_count') ?? '2', 10);
    const referrerCount = parseInt(await this.globalConfig.get('referrer_ticket_count') ?? '3', 10);
    const expiresDays = parseInt(await this.globalConfig.get('referral_ticket_expires_days') ?? '30', 10);

    // Grant tickets to referred user
    await this.predictionTicketsService.grantTickets(
      referredUserId,
      referredCount,
      expiresDays,
      'RACE',
    );

    // Grant tickets to referrer
    await this.predictionTicketsService.grantTickets(
      referralCode.userId,
      referrerCount,
      expiresDays,
      'RACE',
    );

    return {
      success: true,
      ticketsGranted: referredCount,
    };
  }
}
