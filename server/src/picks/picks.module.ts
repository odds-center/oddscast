import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPick } from '../database/entities/user-pick.entity';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { PicksController } from './picks.controller';
import { PicksService } from './picks.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPick, Race, RaceResult])],
  controllers: [PicksController],
  providers: [PicksService],
  exports: [PicksService],
})
export class PicksModule {}
