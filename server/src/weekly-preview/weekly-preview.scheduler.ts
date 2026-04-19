import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WeeklyPreviewService } from './weekly-preview.service';

/**
 * Weekly Preview Report — FEATURE_ROADMAP 3.3
 * Thursday 20:00 KST: generate Gemini summary for upcoming Fri–Sun races.
 * Friday 07:00 KST: retry if Thursday generation failed (self-healing).
 * On server start: retry if latest preview is a failure placeholder.
 */
@Injectable()
export class WeeklyPreviewScheduler implements OnModuleInit {
  private readonly logger = new Logger(WeeklyPreviewScheduler.name);

  constructor(private weeklyPreviewService: WeeklyPreviewService) {}

  /** On server startup, check and retry failed previews (fire-and-forget) */
  onModuleInit() {
    setTimeout(() => this.retryIfFailed().catch(() => {}), 15_000);
  }

  @Cron('0 20 * * 4', { timeZone: 'Asia/Seoul' })
  async runWeeklyPreview(): Promise<void> {
    await this.weeklyPreviewService.generate();
  }

  /** Self-healing: retry on Fri/Sat/Sun morning if preview is a failure placeholder */
  @Cron('0 7 * * 5,6,0', { timeZone: 'Asia/Seoul' })
  async retryIfFailed(): Promise<void> {
    const latest = await this.weeklyPreviewService.getLatest();
    if (!latest?.content?.highlights) return;

    const isFailed =
      latest.content.highlights.includes('AI 요약 생성에 실패했습니다') ||
      latest.content.highlights.includes('Gemini 설정 후 생성됩니다') ||
      (latest.content.highlights.includes('주말') &&
        latest.content.highlights.includes('경주 예정') &&
        (!latest.content.horsesToWatch ||
          latest.content.horsesToWatch.length === 0));

    if (!isFailed) return;

    this.logger.log(
      `[WeeklyPreview] Latest preview is incomplete or failed — retrying generation`,
    );
    await this.weeklyPreviewService.generate();
  }
}
