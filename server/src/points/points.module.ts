import { Module } from '@nestjs/common';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PicksModule } from '../picks/picks.module';

@Module({
  imports: [PrismaModule, PicksModule],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
