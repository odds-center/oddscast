import { Module } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';
import { PredictionsScheduler } from './predictions.scheduler';
import { AnalysisModule } from '../analysis/analysis.module';
import { GlobalConfigModule } from '../config/config.module';
@Module({
  imports: [AnalysisModule, GlobalConfigModule],
  controllers: [PredictionsController],
  providers: [PredictionsService, PredictionsScheduler],
  exports: [PredictionsService],
})
export class PredictionsModule {}
