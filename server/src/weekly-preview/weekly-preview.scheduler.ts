import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WeeklyPreviewService } from './weekly-preview.service';

/**
 * Weekly Preview Report — FEATURE_ROADMAP 3.3
 * Thursday 20:00 KST: generate Gemini summary for upcoming Fri–Sun races.
 * Friday 07:00 KST: retry if Thursday generation failed (self-healing).
 */
@Injectable()
export class WeeklyPreviewScheduler {
  private readonly logger = new Logger(WeeklyPreviewScheduler.name);

  constructor(private weeklyPreviewService: WeeklyPreviewService) {}

  @Cron('0 20 * * 4', { timeZone: 'Asia/Seoul' })
  async runWeeklyPreview(): Promise<void> {
    await this.weeklyPreviewService.generate();
  }

  /** Self-healing: retry on Friday morning if the latest preview is a failure placeholder */
  @Cron('0 7 * * 5', { timeZone: 'Asia/Seoul' })
  async retryIfFailed(): Promise<void> {
    const latest = await this.weeklyPreviewService.getLatest();
    if (!latest?.content?.highlights) return;

    const isFailed =
      latest.content.highlights.includes('AI 요약 생성에 실패했습니다') ||
      latest.content.highlights.includes('Gemini 설정 후 생성됩니다');

    if (!isFailed) return;

    this.logger.log(
      `[WeeklyPreview] Latest preview has failure placeholder — retrying generation`,
    );
    await this.weeklyPreviewService.generate();
  }
}
