import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WeeklyPreviewService } from './weekly-preview.service';

/**
 * Weekly Preview Report — FEATURE_ROADMAP 3.3
 * Thursday 20:00 KST: generate Gemini summary for upcoming Fri–Sun races
 */
@Injectable()
export class WeeklyPreviewScheduler {
  constructor(private weeklyPreviewService: WeeklyPreviewService) {}

  @Cron('0 20 * * 4', { timeZone: 'Asia/Seoul' })
  async runWeeklyPreview(): Promise<void> {
    await this.weeklyPreviewService.generate();
  }
}
