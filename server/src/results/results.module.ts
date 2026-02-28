import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PointsModule } from '../points/points.module';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [PrismaModule, PointsModule, PredictionsModule],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
