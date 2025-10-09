import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KraApiIntegratedService } from '../src/kra-api/kra-api-integrated.service';
import { RacesService } from '../src/races/races.service';
import { ResultsService } from '../src/results/results.service';
import { RacePlansService } from '../src/race-plans/race-plans.service';
import * as moment from 'moment';
import { Logger } from '@nestjs/common';

/**
 * 과거 데이터 초기화 스크립트
 *
 * 목적:
 * - KRA API에서 과거 경마 데이터를 수집하여 DB에 저장
 * - AI 학습을 위한 충분한 데이터 확보
 * - 최소 1년치 데이터 수집 (약 50,000+ 경주)
 *
 * 사용법:
 * npm run init:data
 * npm run init:data -- --start 20240101 --end 20241231
 * npm run init:data -- --year 2024
 */

interface CollectionStats {
  totalDays: number;
  successDays: number;
  failedDays: number;
  totalRaces: number;
  totalResults: number;
  totalPlans: number;
  totalDividends: number;
  totalEntries: number;
  errors: { date: string; error: string }[];
  startTime: Date;
  endTime?: Date;
}

class HistoricalDataInitializer {
  private readonly logger = new Logger('HistoricalDataInit');
  private stats: CollectionStats = {
    totalDays: 0,
    successDays: 0,
    failedDays: 0,
    totalRaces: 0,
    totalResults: 0,
    totalPlans: 0,
    totalDividends: 0,
    totalEntries: 0,
    errors: [],
    startTime: new Date(),
  };

  constructor(
    private kraApiService: KraApiIntegratedService,
    private racesService: RacesService,
    private resultsService: ResultsService,
    private racePlansService: RacePlansService
  ) {}

  /**
   * 특정 날짜의 데이터 수집
   */
  async collectDateData(date: string): Promise<boolean> {
    try {
      // 날짜의 요일 확인 (한국 경마는 주말만 운영)
      const dateObj = moment(date, 'YYYYMMDD');
      const dayOfWeek = dateObj.day(); // 0: 일요일, 6: 토요일
      const dayName = dateObj.format('dddd');

      this.logger.log(`\n📅 ${date} (${dayName}) 데이터 수집 시작...`);

      // 월-목 (1-4)은 일반적으로 경마가 없음
      if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        this.logger.log(`  ℹ️ 평일 (${dayName}) - 경마 없음 (스킵)`);
        this.stats.successDays++;
        return true;
      }

      let hasData = false;

      // 1. 경주 결과 수집
      const resultsCount = await this.collectRaceResults(date);
      hasData = hasData || resultsCount > 0;

      // 2. 경주 계획 수집
      const plansCount = await this.collectRacePlans(date);
      hasData = hasData || plansCount > 0;

      // 3. 출전표 수집
      await this.collectEntrySheets(date);

      // 4. 확정 배당율 수집
      await this.collectDividendRates(date);

      if (hasData) {
        this.stats.successDays++;
        this.logger.log(`✅ ${date} 데이터 수집 완료`);
      } else {
        this.logger.log(`ℹ️ ${date} 경주 없음`);
        this.stats.successDays++;
      }

      return true;
    } catch (error) {
      this.stats.failedDays++;
      this.stats.errors.push({
        date,
        error: error.message,
      });
      this.logger.error(`❌ ${date} 데이터 수집 실패: ${error.message}`);
      return false;
    }
  }

  /**
   * 경주 결과 수집
   */
  private async collectRaceResults(date: string): Promise<number> {
    try {
      const results = await this.kraApiService.getDailyRaceRecords(date);

      if (results && results.length > 0) {
        this.logger.log(`  🏁 경주 결과 ${results.length}건 발견`);

        for (const result of results) {
          try {
            await this.resultsService.createFromKraData(result);
            this.stats.totalResults++;
          } catch (error) {
            // 중복 데이터는 무시
            if (!error.message?.includes('Duplicate')) {
              this.logger.warn(`  ⚠️ 결과 저장 실패: ${error.message}`);
            }
          }
        }
        return results.length;
      }

      return 0;
    } catch (error) {
      // 500 에러는 데이터가 없는 경우 (경주 없음)
      if (error.message?.includes('500')) {
        return 0;
      }
      this.logger.warn(`  ⚠️ 경주 결과 수집 실패: ${error.message}`);
      return 0;
    }
  }

  /**
   * 경주 계획 수집
   */
  private async collectRacePlans(date: string): Promise<number> {
    try {
      const plans = await this.kraApiService.getDailyRacePlans(date);

      if (plans && plans.length > 0) {
        this.logger.log(`  📋 경주 계획 ${plans.length}건 발견`);

        for (const plan of plans) {
          try {
            await this.racePlansService.createFromKraData(plan);
            this.stats.totalPlans++;
          } catch (error) {
            if (!error.message?.includes('Duplicate')) {
              this.logger.warn(`  ⚠️ 계획 저장 실패: ${error.message}`);
            }
          }
        }
        return plans.length;
      }

      return 0;
    } catch (error) {
      // 500 에러는 데이터가 없는 경우 (경주 없음)
      if (error.message?.includes('500')) {
        return 0;
      }
      this.logger.warn(`  ⚠️ 경주 계획 수집 실패: ${error.message}`);
      return 0;
    }
  }

  /**
   * 출전표 수집
   */
  private async collectEntrySheets(date: string): Promise<void> {
    try {
      const entries = await this.kraApiService.getDailyEntrySheets(date);

      if (entries && entries.length > 0) {
        this.logger.log(`  🐴 출전표 ${entries.length}건 발견`);
        this.stats.totalEntries += entries.length;
        // Note: 출전표는 별도 엔티티가 없으므로 통계만 기록
      } else {
        this.logger.log(`  ℹ️ 출전표 없음`);
      }
    } catch (error) {
      // 500 에러는 데이터가 없는 경우가 많으므로 warn으로 처리
      if (error.message?.includes('500')) {
        this.logger.log(`  ℹ️ 출전표 데이터 없음 (${date})`);
      } else {
        this.logger.warn(`  ⚠️ 출전표 수집 실패: ${error.message}`);
      }
    }
  }

  /**
   * 확정 배당율 수집
   */
  private async collectDividendRates(date: string): Promise<void> {
    try {
      const dividends = await this.kraApiService.getDailyDividendRates(date);

      if (dividends && dividends.length > 0) {
        this.logger.log(`  💰 배당율 ${dividends.length}건 발견`);
        this.stats.totalDividends += dividends.length;
        // Note: 배당율도 별도 서비스가 필요하면 추가
      } else {
        this.logger.log(`  ℹ️ 배당율 없음`);
      }
    } catch (error) {
      // 500 에러는 데이터가 없는 경우가 많으므로 warn으로 처리
      if (error.message?.includes('500')) {
        this.logger.log(`  ℹ️ 배당율 데이터 없음 (${date})`);
      } else {
        this.logger.warn(`  ⚠️ 배당율 수집 실패: ${error.message}`);
      }
    }
  }

  /**
   * 기간별 데이터 수집
   */
  async collectPeriod(startDate: string, endDate: string): Promise<void> {
    const start = moment(startDate, 'YYYYMMDD');
    const end = moment(endDate, 'YYYYMMDD');
    const totalDays = end.diff(start, 'days') + 1;

    this.stats.totalDays = totalDays;

    this.logger.log('\n' + '='.repeat(60));
    this.logger.log('🚀 과거 데이터 수집 시작');
    this.logger.log('='.repeat(60));
    this.logger.log(`📅 수집 기간: ${startDate} ~ ${endDate}`);
    this.logger.log(`📊 총 일수: ${totalDays}일`);
    this.logger.log(`⏰ 시작 시간: ${this.stats.startTime.toISOString()}`);
    this.logger.log('='.repeat(60) + '\n');

    let currentDate = start.clone();
    let processedDays = 0;

    while (currentDate.isSameOrBefore(end)) {
      const dateStr = currentDate.format('YYYYMMDD');

      await this.collectDateData(dateStr);
      processedDays++;

      // 진행률 표시
      const progress = ((processedDays / totalDays) * 100).toFixed(1);
      this.logger.log(
        `📈 진행률: ${progress}% (${processedDays}/${totalDays}일)\n`
      );

      // API 호출 제한 준수 (1초 대기)
      await new Promise(resolve => setTimeout(resolve, 1000));

      currentDate.add(1, 'day');
    }

    this.stats.endTime = new Date();
    this.printSummary();
  }

  /**
   * 최근 N일 데이터 수집
   */
  async collectRecentDays(days: number): Promise<void> {
    // 어제까지만 수집 (오늘은 경주가 아직 완료되지 않았을 수 있음)
    const endDate = moment().subtract(1, 'days').format('YYYYMMDD');
    const startDate = moment().subtract(days, 'days').format('YYYYMMDD');

    this.logger.log(
      `📅 최근 ${days}일 수집: ${startDate} ~ ${endDate} (어제까지)`
    );
    await this.collectPeriod(startDate, endDate);
  }

  /**
   * 특정 연도 전체 데이터 수집
   */
  async collectYear(year: number): Promise<void> {
    const startDate = `${year}0101`;
    const endDate = `${year}1231`;

    await this.collectPeriod(startDate, endDate);
  }

  /**
   * 결과 요약 출력
   */
  private printSummary(): void {
    const duration = this.stats.endTime
      ? (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000
      : 0;

    this.logger.log('\n' + '='.repeat(60));
    this.logger.log('📊 데이터 수집 완료 요약');
    this.logger.log('='.repeat(60));

    this.logger.log(`📅 총 처리 일수: ${this.stats.totalDays}일`);
    this.logger.log(`✅ 성공: ${this.stats.successDays}일`);
    this.logger.log(`❌ 실패: ${this.stats.failedDays}일`);
    this.logger.log(
      `📈 성공률: ${((this.stats.successDays / this.stats.totalDays) * 100).toFixed(2)}%`
    );
    this.logger.log(`⏱️  소요 시간: ${duration.toFixed(0)}초`);

    this.logger.log('\n📊 수집된 데이터:');
    this.logger.log(`  🏁 경주 결과: ${this.stats.totalResults}건`);
    this.logger.log(`  📋 경주 계획: ${this.stats.totalPlans}건`);
    this.logger.log(`  💰 배당율: ${this.stats.totalDividends}건`);
    this.logger.log(`  🐴 출전표: ${this.stats.totalEntries}건`);

    if (this.stats.errors.length > 0) {
      this.logger.log('\n❌ 오류 발생 날짜:');
      this.stats.errors.slice(0, 10).forEach(err => {
        this.logger.log(`  - ${err.date}: ${err.error}`);
      });
      if (this.stats.errors.length > 10) {
        this.logger.log(`  ... 외 ${this.stats.errors.length - 10}건`);
      }
    }

    this.logger.log('\n⏰ 시작: ' + this.stats.startTime.toISOString());
    this.logger.log('⏰ 종료: ' + (this.stats.endTime?.toISOString() || 'N/A'));
    this.logger.log('='.repeat(60) + '\n');
  }

  /**
   * 데이터 수집 상태 확인
   */
  async checkDataCoverage(): Promise<void> {
    this.logger.log('\n📊 데이터베이스 커버리지 확인\n');

    try {
      // 각 테이블의 데이터 개수 확인
      const raceCount = await this.racesService.count();
      const resultCount = await this.resultsService.count();
      const planCount = await this.racePlansService.count();

      this.logger.log(`🏁 경주 데이터: ${raceCount}건`);
      this.logger.log(`📊 경주 결과: ${resultCount}건`);
      this.logger.log(`📋 경주 계획: ${planCount}건`);

      // 날짜 범위 확인
      const dateRange = await this.resultsService.getDateRange();
      if (dateRange) {
        this.logger.log(
          `\n📅 데이터 기간: ${dateRange.minDate} ~ ${dateRange.maxDate}`
        );
      }

      this.logger.log('');
    } catch (error) {
      this.logger.error('커버리지 확인 실패:', error);
    }
  }
}

/**
 * 메인 실행 함수
 */
async function bootstrap() {
  const logger = new Logger('InitScript');

  try {
    logger.log('\n🚀 NestJS 애플리케이션 부트스트랩 중...\n');

    // NestJS 앱 초기화 (서버 시작 없이)
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // 필요한 서비스들 가져오기
    const kraApiService = app.get(KraApiIntegratedService);
    const racesService = app.get(RacesService);
    const resultsService = app.get(ResultsService);
    const racePlansService = app.get(RacePlansService);

    // 초기화 클래스 생성
    const initializer = new HistoricalDataInitializer(
      kraApiService,
      racesService,
      resultsService,
      racePlansService
    );

    // 명령줄 인자 파싱
    const args = process.argv.slice(2);
    const startArg = args
      .find(arg => arg.startsWith('--start='))
      ?.split('=')[1];
    const endArg = args.find(arg => arg.startsWith('--end='))?.split('=')[1];
    const yearArg = args.find(arg => arg.startsWith('--year='))?.split('=')[1];
    const daysArg = args.find(arg => arg.startsWith('--days='))?.split('=')[1];
    const checkArg = args.includes('--check');

    // 데이터 커버리지만 확인
    if (checkArg) {
      await initializer.checkDataCoverage();
      await app.close();
      return;
    }

    // 수집 모드 결정
    if (yearArg) {
      // 특정 연도 전체
      logger.log(`📅 ${yearArg}년 전체 데이터 수집 시작\n`);
      await initializer.collectYear(parseInt(yearArg));
    } else if (daysArg) {
      // 최근 N일
      logger.log(`📅 최근 ${daysArg}일 데이터 수집 시작\n`);
      await initializer.collectRecentDays(parseInt(daysArg));
    } else if (startArg && endArg) {
      // 특정 기간
      logger.log(`📅 ${startArg} ~ ${endArg} 기간 데이터 수집 시작\n`);
      await initializer.collectPeriod(startArg, endArg);
    } else {
      // 기본값: 최근 30일
      logger.log('📅 기본 모드: 최근 30일 데이터 수집 시작\n');
      await initializer.collectRecentDays(30);
    }

    // 최종 커버리지 확인
    await initializer.checkDataCoverage();

    await app.close();
    logger.log('\n✅ 데이터 초기화 완료!\n');
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ 초기화 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
bootstrap();
