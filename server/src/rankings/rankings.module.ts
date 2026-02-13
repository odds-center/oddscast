import { Module } from '@nestjs/common';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PicksModule } from '../picks/picks.module';

@Module({
  imports: [PrismaModule, PicksModule],
  controllers: [RankingsController],
  providers: [RankingsService],
})
export class RankingsModule {}
