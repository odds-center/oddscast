import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KraApiIntegratedService } from '../kra-api/kra-api-integrated.service';
import { RacePlansService } from '../race-plans/race-plans.service';
import { ResultsService } from '../results/results.service';
import { DividendRatesService } from '@/results/dividend-rates.service';
import * as moment from 'moment';

@Injectable()
export class KraDataSchedulerService {
  private readonly logger = new Logger(KraDataSchedulerService.name);

  constructor(
    private readonly kraApiService: KraApiIntegratedService,
    private readonly resultsService: ResultsService,
    private readonly racePlansService: RacePlansService,
    private readonly dividendRatesService: DividendRatesService
  ) {}

  /**
   * 매일 오전 6시에 전날 경주 결과 데이터 수집
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async collectDailyRaceResults() {
    this.logger.log('🚀 일일 경주 결과 데이터 수집 시작');

    try {
      const yesterday = moment().subtract(1, 'day').format('YYYYMMDD');
      await this.collectRaceResultsForDate(yesterday);
      this.logger.log(`✅ ${yesterday} 경주 결과 데이터 수집 완료`);
    } catch (error) {
      this.logger.error(`❌ 일일 경주 결과 수집 실패: ${error.message}`);
    }
  }

  /**
   * 매일 오전 7시에 오늘 경주 계획 데이터 수집
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async collectDailyRacePlans() {
    this.logger.log('🚀 일일 경주 계획 데이터 수집 시작');

    try {
      const today = moment().format('YYYYMMDD');
      await this.collectRacePlansForDate(today);
      this.logger.log(`✅ ${today} 경주 계획 데이터 수집 완료`);
    } catch (error) {
      this.logger.error(`❌ 일일 경주 계획 수집 실패: ${error.message}`);
    }
  }

  /**
   * 매일 오후 2시에 확정 배당율 데이터 수집
   */
  @Cron('0 14 * * *') // 매일 오후 2시
  async collectDailyDividendRates() {
    this.logger.log('🚀 일일 확정 배당율 데이터 수집 시작');

    try {
      const today = moment().format('YYYYMMDD');
      await this.collectDividendRatesForDate(today);
      this.logger.log(`✅ ${today} 확정 배당율 데이터 수집 완료`);
    } catch (error) {
      this.logger.error(`❌ 일일 확정 배당율 수집 실패: ${error.message}`);
    }
  }

  /**
   * 특정 날짜의 경주 결과 데이터 수집
   */
  async collectRaceResultsForDate(date: string) {
    this.logger.log(`📊 ${date} 경주 결과 데이터 수집 시작`);

    try {
      // KRA API에서 경주 결과 조회
      const raceRecords = await this.kraApiService.getDailyRaceRecords(
        date.replace(/-/g, '')
      );

      if (!raceRecords || raceRecords.length === 0) {
        this.logger.warn(`⚠️ ${date} 경주 결과 데이터가 없습니다.`);
        return;
      }

      this.logger.log(`📊 ${date} 경주 결과 ${raceRecords.length}개 발견`);

      // 각 경주 결과를 DB에 저장
      for (const item of raceRecords) {
        try {
          await this.resultsService.createFromKraData(item);
        } catch (error) {
          this.logger.error(
            `❌ 경주 결과 저장 실패 (${item.rcNo || 'unknown'}): ${error.message}`
          );
        }
      }

      this.logger.log(`✅ ${date} 경주 결과 ${raceRecords.length}개 저장 완료`);
    } catch (error) {
      this.logger.error(`❌ ${date} 경주 결과 수집 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 특정 날짜의 경주 계획 데이터 수집
   */
  async collectRacePlansForDate(date: string) {
    this.logger.log(`📋 ${date} 경주 계획 데이터 수집 시작`);

    try {
      // KRA API에서 경주 계획 조회
      const racePlans = await this.kraApiService.getDailyRacePlans(
        date.replace(/-/g, '')
      );

      if (!racePlans || racePlans.length === 0) {
        this.logger.warn(`⚠️ ${date} 경주 계획 데이터가 없습니다.`);
        return;
      }

      this.logger.log(`📋 ${date} 경주 계획 ${racePlans.length}개 발견`);

      // 각 경주 계획을 DB에 저장
      for (const item of racePlans) {
        try {
          await this.racePlansService.createFromKraData(item);
        } catch (error) {
          this.logger.error(
            `❌ 경주 계획 저장 실패 (${item.rcNo || 'unknown'}): ${error.message}`
          );
        }
      }

      this.logger.log(`✅ ${date} 경주 계획 ${racePlans.length}개 저장 완료`);
    } catch (error) {
      this.logger.error(`❌ ${date} 경주 계획 수집 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 특정 날짜의 확정 배당율 데이터 수집
   */
  async collectDividendRatesForDate(date: string) {
    this.logger.log(`💰 ${date} 확정 배당율 데이터 수집 시작`);

    try {
      // KRA API에서 확정 배당율 조회
      const dividendRates = await this.kraApiService.getDailyDividendRates(
        date.replace(/-/g, '')
      );

      if (!dividendRates || dividendRates.length === 0) {
        this.logger.warn(`⚠️ ${date} 확정 배당율 데이터가 없습니다.`);
        return;
      }

      this.logger.log(`💰 ${date} 확정 배당율 ${dividendRates.length}개 발견`);

      // 각 확정 배당율을 DB에 저장
      for (const item of dividendRates) {
        try {
          await this.dividendRatesService.createFromKraData(item);
        } catch (error) {
          this.logger.error(
            `❌ 확정 배당율 저장 실패 (${item.winType || 'unknown'}): ${error.message}`
          );
        }
      }

      this.logger.log(
        `✅ ${date} 확정 배당율 ${dividendRates.length}개 저장 완료`
      );
    } catch (error) {
      this.logger.error(`❌ ${date} 확정 배당율 수집 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 과거 1년치 데이터 수집 (수동 실행용)
   */
  async collectHistoricalData() {
    this.logger.log('📚 과거 1년치 데이터 수집 시작');

    const startDate = moment().subtract(1, 'year').startOf('day');
    const endDate = moment().endOf('day');

    let currentDate = startDate.clone();
    let processedCount = 0;

    while (currentDate.isSameOrBefore(endDate)) {
      const dateStr = currentDate.format('YYYYMMDD');

      try {
        this.logger.log(
          `📊 ${dateStr} 데이터 수집 중... (${processedCount + 1}/365)`
        );

        // 경주 결과 수집
        await this.collectRaceResultsForDate(dateStr);

        // 경주 계획 수집
        await this.collectRacePlansForDate(dateStr);

        // 확정 배당율 수집
        await this.collectDividendRatesForDate(dateStr);

        processedCount++;

        // API 호출 제한을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`❌ ${dateStr} 데이터 수집 실패: ${error.message}`);
      }

      currentDate.add(1, 'day');
    }

    this.logger.log(`✅ 과거 1년치 데이터 수집 완료 (${processedCount}일)`);
  }

  /**
   * 특정 기간의 데이터 수집 (수동 실행용)
   */
  async collectDataForPeriod(startDate: string, endDate: string) {
    this.logger.log(`📊 ${startDate} ~ ${endDate} 기간 데이터 수집 시작`);

    const start = moment(startDate, 'YYYYMMDD');
    const end = moment(endDate, 'YYYYMMDD');
    let currentDate = start.clone();
    let processedCount = 0;

    while (currentDate.isSameOrBefore(end)) {
      const dateStr = currentDate.format('YYYYMMDD');

      try {
        this.logger.log(`📊 ${dateStr} 데이터 수집 중...`);

        // 경주 결과 수집
        await this.collectRaceResultsForDate(dateStr);

        // 경주 계획 수집
        await this.collectRacePlansForDate(dateStr);

        // 확정 배당율 수집
        await this.collectDividendRatesForDate(dateStr);

        processedCount++;

        // API 호출 제한을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`❌ ${dateStr} 데이터 수집 실패: ${error.message}`);
      }

      currentDate.add(1, 'day');
    }

    this.logger.log(
      `✅ ${startDate} ~ ${endDate} 기간 데이터 수집 완료 (${processedCount}일)`
    );
  }

  /**
   * 데이터베이스 정리 (30일 이전 데이터 삭제)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldData() {
    this.logger.log('🧹 오래된 데이터 정리 시작');

    try {
      const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYYMMDD');

      // 30일 이전 데이터 삭제
      await this.resultsService.deleteOldData(thirtyDaysAgo);
      await this.racePlansService.deleteOldData(thirtyDaysAgo);
      await this.dividendRatesService.deleteOldData(thirtyDaysAgo);

      this.logger.log(`✅ ${thirtyDaysAgo} 이전 데이터 정리 완료`);
    } catch (error) {
      this.logger.error(`❌ 오래된 데이터 정리 실패: ${error.message}`);
    }
  }
}
