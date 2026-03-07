import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralCode } from '../database/entities/referral-code.entity';
import { ReferralClaim } from '../database/entities/referral-claim.entity';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { PredictionTicketsModule } from '../prediction-tickets/prediction-tickets.module';
import { GlobalConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReferralCode, ReferralClaim]),
    PredictionTicketsModule,
    GlobalConfigModule,
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
})
export class ReferralsModule {}
