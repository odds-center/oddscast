import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyPreview } from '../database/entities/weekly-preview.entity';
import { Race } from '../database/entities/race.entity';
import { WeeklyPreviewService } from './weekly-preview.service';
import { WeeklyPreviewController } from './weekly-preview.controller';
import { WeeklyPreviewScheduler } from './weekly-preview.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([WeeklyPreview, Race])],
  controllers: [WeeklyPreviewController],
  providers: [WeeklyPreviewService, WeeklyPreviewScheduler],
  exports: [WeeklyPreviewService],
})
export class WeeklyPreviewModule {}
