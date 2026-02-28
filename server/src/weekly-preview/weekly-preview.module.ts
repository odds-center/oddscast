import { Module } from '@nestjs/common';
import { WeeklyPreviewService } from './weekly-preview.service';
import { WeeklyPreviewController } from './weekly-preview.controller';
import { WeeklyPreviewScheduler } from './weekly-preview.scheduler';

@Module({
  controllers: [WeeklyPreviewController],
  providers: [WeeklyPreviewService, WeeklyPreviewScheduler],
  exports: [WeeklyPreviewService],
})
export class WeeklyPreviewModule {}
