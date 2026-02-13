import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionsService } from './predictions.service';
import { GlobalConfigService } from '../config/config.service';

/**
 * 예측 자동 생성 Cron (BUSINESS_LOGIC 1.1)
 * - 경기일 금/토/일 09:00 실행 (syncRaceDayMorning 08:00 이후)
 * - Admin ai_config.enableBatchPrediction = false 시 스킵
 * - 당일 경기 중 예측이 없는 경기에 대해 generatePrediction 호출
 */
@Injectable()
export class PredictionsScheduler {
  private readonly logger = new Logger(PredictionsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private predictionsService: PredictionsService,
    private configService: GlobalConfigService,
  ) {}

  @Cron('0 9 * * 5,6,0') // Fri, Sat, Sun at 09:00 KST (ai_config.batchCronSchedule 참고)
  async generatePredictionsForToday() {
    const raw = await this.configService.get('ai_config');
    const config = raw ? JSON.parse(raw) : {};
    if (config.enableBatchPrediction === false) {
      this.logger.log('[Cron] Batch prediction disabled in ai_config, skipping');
      return;
    }
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.logger.log(`[Cron] Generate predictions for ${today}`);

    const races = await this.prisma.race.findMany({
      where: {
        rcDate: today,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        NOT: {
          predictions: {
            some: { status: 'COMPLETED' },
          },
        },
      },
      select: { id: true, rcNo: true, meet: true },
    });

    if (!races.length) {
      this.logger.log(`[Cron] No races to predict for ${today}`);
      return;
    }

    let ok = 0;
    let fail = 0;
    for (const race of races) {
      try {
        await this.predictionsService.generatePrediction(race.id);
        ok++;
        this.logger.log(`[Cron] Prediction generated: ${race.meet} R${race.rcNo}`);
      } catch (err) {
        fail++;
        this.logger.error(
          `[Cron] Failed ${race.meet} R${race.rcNo}: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(`[Cron] Done: ${ok} ok, ${fail} fail`);
  }
}
