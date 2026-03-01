import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { PicksModule } from '../picks/picks.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PicksModule],
  controllers: [RankingsController],
  providers: [RankingsService],
})
export class RankingsModule {}
