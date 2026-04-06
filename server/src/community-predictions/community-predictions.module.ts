import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityPrediction } from '../database/entities/community-prediction.entity';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { User } from '../database/entities/user.entity';
import { CommunityPredictionsService } from './community-predictions.service';
import { CommunityPredictionsController } from './community-predictions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommunityPrediction, Race, RaceResult, User])],
  controllers: [CommunityPredictionsController],
  providers: [CommunityPredictionsService],
  exports: [CommunityPredictionsService],
})
export class CommunityPredictionsModule {}
