import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  KRA_MEETS,
  KraApiUsage,
  KraMeetInfo,
} from './interfaces/kra-api.interface';
import { KraApiService } from './kra-api.service';
import { KraRacePlan } from './dto/kra-race-plans.dto';

@Injectable()
export class KraSchedulerService {
  private readonly logger = new Logger(KraSchedulerService.name);
  private dailyUsage: Map<string, number> = new Map();
  private readonly DAILY_LIMIT = 10000; // 일일 트래픽 제한

  constructor(private readonly kraApiService: KraApiService) {
    this.initializeDailyUsage();
  }

  /**
   * 일일 사용량 초기화
   */
  private initializeDailyUsage() {
    const today = new Date().toISOString().split('T')[0];
    this.dailyUsage.set(today, 0);
  }

  /**
   * 매일 자정에 일일 사용량 초기화
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyUsage() {
    const today = new Date().toISOString().split('T')[0];
    this.dailyUsage.clear();
    this.dailyUsage.set(today, 0);
    this.logger.log('Daily API usage reset');
  }

  /**
   * 매시간 경주계획표 데이터 수집 (09:00 ~ 18:00)
   */
  @Cron('0 9-18 * * *')
  async collectRacePlans() {
    const currentHour = new Date().getHours();
    if (currentHour < 9 || currentHour > 18) {
      return; // 경마 운영 시간 외에는 수집하지 않음
    }

    try {
      this.logger.log('Starting scheduled race plan collection');

      // 일일 사용량 확인
      if (this.getCurrentDailyUsage() >= this.DAILY_LIMIT) {
        this.logger.warn('Daily API limit reached, skipping collection');
        return;
      }

      // 각 경마장별로 경주계획표 수집
      for (const meet of KRA_MEETS) {
        await this.collectRacePlansForMeet(meet);
        await this.delay(1000); // API 호출 간격 조절
      }

      this.logger.log('Scheduled race plan collection completed');
    } catch (error) {
      this.logger.error('Scheduled race plan collection failed', error);
    }
  }

  /**
   * 특정 경마장의 경주계획표 수집
   */
  private async collectRacePlansForMeet(meet: KraMeetInfo) {
    try {
      this.logger.log(`Collecting race plans for ${meet.name} (${meet.code})`);

      // 오늘부터 7일 후까지의 경주계획 수집
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

        // 일일 사용량 확인
        if (this.getCurrentDailyUsage() >= this.DAILY_LIMIT) {
          this.logger.warn(
            `Daily API limit reached while collecting for ${meet.name}`
          );
          break;
        }
        const racePlans = await this.kraApiService.getRacePlans(dateStr);

        if (racePlans && racePlans.data && racePlans.data.length > 0) {
          this.logger.log(
            `Collected ${racePlans.data.length} race plans for ${meet.name} on ${dateStr}`
          );

          // 데이터베이스에 저장 (구현 필요)
          await this.saveRacePlansToDatabase(racePlans.data, meet);
        }

        // API 사용량 증가
        this.incrementDailyUsage();

        // API 호출 간격 조절
        await this.delay(500);
      }
    } catch (error) {
      this.logger.error(`Failed to collect race plans for ${meet.name}`, error);
    }
  }

  /**
   * 경주계획표를 데이터베이스에 저장
   */
  private async saveRacePlansToDatabase(
    racePlans: KraRacePlan[],
    meet: KraMeetInfo
  ) {
    try {
      // TODO: 실제 데이터베이스 저장 로직 구현
      // - Race 엔티티에 저장
      // - 중복 데이터 처리
      // - 데이터 업데이트 로직

      this.logger.log(
        `Saved ${racePlans.length} race plans to database for ${meet.name}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save race plans to database for ${meet.name}`,
        error
      );
    }
  }

  /**
   * 현재 일일 사용량 조회
   */
  getCurrentDailyUsage(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyUsage.get(today) || 0;
  }

  /**
   * 일일 사용량 증가
   */
  private incrementDailyUsage() {
    const today = new Date().toISOString().split('T')[0];
    const current = this.dailyUsage.get(today) || 0;
    this.dailyUsage.set(today, current + 1);
  }

  /**
   * 일일 사용량 정보 조회
   */
  getDailyUsageInfo(): KraApiUsage {
    const today = new Date().toISOString().split('T')[0];
    const count = this.dailyUsage.get(today) || 0;

    return {
      date: today,
      count,
      limit: this.DAILY_LIMIT,
      remaining: Math.max(0, this.DAILY_LIMIT - count),
    };
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 수동으로 경주계획표 수집 실행
   */
  async manualCollection(meetCode?: string, days?: number) {
    try {
      this.logger.log('Starting manual race plan collection');

      const targetMeets = meetCode
        ? KRA_MEETS.filter(m => m.code === meetCode)
        : KRA_MEETS;

      const targetDays = days || 7;

      for (const meet of targetMeets) {
        await this.collectRacePlansForMeet(meet);
        await this.delay(1000);
      }

      this.logger.log('Manual race plan collection completed');
    } catch (error) {
      this.logger.error('Manual race plan collection failed', error);
      throw error;
    }
  }
}
