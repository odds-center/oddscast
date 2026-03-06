import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ReferralCode } from '../database/entities/referral-code.entity';
import { ReferralClaim } from '../database/entities/referral-claim.entity';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';

const REFERRER_TICKETS = 3;
const REFERRED_TICKETS = 2;
const REFERRAL_EXPIRES_DAYS = 30;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    s += chars[bytes[i]! % chars.length];
  }
  return s;
}

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(ReferralCode)
    private readonly referralCodeRepo: Repository<ReferralCode>,
    @InjectRepository(ReferralClaim)
    private readonly referralClaimRepo: Repository<ReferralClaim>,
    private readonly predictionTickets: PredictionTicketsService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getOrCreateMyCode(
    userId: number,
  ): Promise<{ code: string; usedCount: number; maxUses: number }> {
    let codeEntity = await this.referralCodeRepo.findOne({
      where: { userId },
      select: ['id', 'code', 'usedCount', 'maxUses'],
    });
    if (!codeEntity) {
      let code: string | null = null;
      for (let i = 0; i < 5; i++) {
        const candidate = generateCode();
        const exists = await this.referralCodeRepo.findOne({
          where: { code: candidate },
          select: ['id'],
        });
        if (!exists) {
          code = candidate;
          break;
        }
      }
      if (!code) {
        throw new BadRequestException(
          '추천 코드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
      const now = new Date();
      codeEntity = this.referralCodeRepo.create({
        userId,
        code,
        maxUses: 10,
        usedCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      await this.referralCodeRepo.save(codeEntity);
    }
    return {
      code: codeEntity.code,
      usedCount: codeEntity.usedCount,
      maxUses: codeEntity.maxUses,
    };
  }

  async claim(
    userId: number,
    code: string,
  ): Promise<{
    message: string;
    referrerTickets: number;
    referredTickets: number;
  }> {
    const trimmed = code.trim().toUpperCase();
    const referral = await this.referralCodeRepo.findOne({
      where: { code: trimmed },
      select: ['id', 'userId', 'usedCount', 'maxUses'],
    });
    if (!referral) {
      throw new NotFoundException('유효하지 않은 추천 코드입니다.');
    }
    if (referral.userId === userId) {
      throw new BadRequestException('본인의 추천 코드는 사용할 수 없습니다.');
    }
    if (referral.usedCount >= referral.maxUses) {
      throw new BadRequestException('이 추천 코드는 사용 한도에 도달했습니다.');
    }

    const existingClaim = await this.referralClaimRepo.findOne({
      where: { referredUserId: userId },
      select: ['id'],
    });
    if (existingClaim) {
      throw new BadRequestException(
        '이미 추천 코드를 사용하셨습니다. 한 계정당 한 번만 사용할 수 있습니다.',
      );
    }

    // Transaction + unique constraint on referredUserId prevents race conditions
    await this.dataSource.transaction(async (manager) => {
      await manager.save(
        ReferralClaim,
        manager.create(ReferralClaim, {
          referralCodeId: referral.id,
          referredUserId: userId,
        }),
      );

      // Atomic increment prevents lost updates from concurrent claims
      await manager
        .createQueryBuilder()
        .update(ReferralCode)
        .set({ usedCount: () => '"usedCount" + 1' })
        .where('id = :id AND "usedCount" < "maxUses"', { id: referral.id })
        .execute();
    });

    await this.predictionTickets.grantTickets(
      userId,
      REFERRED_TICKETS,
      REFERRAL_EXPIRES_DAYS,
      'RACE',
    );
    await this.predictionTickets.grantTickets(
      referral.userId,
      REFERRER_TICKETS,
      REFERRAL_EXPIRES_DAYS,
      'RACE',
    );

    return {
      message: '추천 코드가 적용되었습니다. 예측권이 지급되었습니다.',
      referrerTickets: REFERRER_TICKETS,
      referredTickets: REFERRED_TICKETS,
    };
  }
}
