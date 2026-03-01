import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralCode } from '../database/entities/referral-code.entity';
import { ReferralClaim } from '../database/entities/referral-claim.entity';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PredictionTicketsModule } from '../prediction-tickets/prediction-tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReferralCode, ReferralClaim]),
    PredictionTicketsModule,
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
