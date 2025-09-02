import axios from 'axios';
import * as moment from 'moment';

// 설정
const API_BASE_URL = 'http://localhost:3002/api';
const START_DATE = '20240902'; // 2024년 9월 2일 (1년 전)
const END_DATE = '20250902'; // 2025년 9월 2일 (현재)

interface CollectionResult {
  date: string;
  raceResults: number;
  racePlans: number;
  dividendRates: number;
  success: boolean;
  error?: string;
}

class HistoricalDataCollector {
  private results: CollectionResult[] = [];
  private totalProcessed = 0;
  private totalErrors = 0;

  constructor() {
    console.log('🚀 KRA 과거 데이터 수집기 시작');
    console.log(`📅 수집 기간: ${START_DATE} ~ ${END_DATE}`);
    console.log('⏰ 시작 시간:', new Date().toISOString());
  }

  /**
   * API 호출 함수
   */
  private async callApi(endpoint: string, params?: any): Promise<any> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await axios.post(url, null, { params });
      return response.data;
    } catch (error: any) {
      console.error(
        `❌ API 호출 실패 (${endpoint}):`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 특정 날짜의 경주 결과 수집
   */
  private async collectRaceResults(date: string): Promise<number> {
    try {
      const result = await this.callApi(
        '/batch/kra-data/collect-daily-results',
        { date }
      );
      console.log(`✅ ${date} 경주 결과 수집 완료`);
      return 1; // 성공
    } catch (error) {
      console.error(`❌ ${date} 경주 결과 수집 실패`);
      return 0; // 실패
    }
  }

  /**
   * 특정 날짜의 경주 계획 수집
   */
  private async collectRacePlans(date: string): Promise<number> {
    try {
      const result = await this.callApi('/batch/kra-data/collect-daily-plans', {
        date,
      });
      console.log(`✅ ${date} 경주 계획 수집 완료`);
      return 1; // 성공
    } catch (error) {
      console.error(`❌ ${date} 경주 계획 수집 실패`);
      return 0; // 실패
    }
  }

  /**
   * 특정 날짜의 확정 배당율 수집
   */
  private async collectDividendRates(date: string): Promise<number> {
    try {
      const result = await this.callApi(
        '/batch/kra-data/collect-daily-dividends',
        { date }
      );
      console.log(`✅ ${date} 확정 배당율 수집 완료`);
      return 1; // 성공
    } catch (error) {
      console.error(`❌ ${date} 확정 배당율 수집 실패`);
      return 0; // 실패
    }
  }

  /**
   * 특정 날짜의 모든 데이터 수집
   */
  private async collectDataForDate(date: string): Promise<CollectionResult> {
    const startTime = Date.now();

    try {
      console.log(`\n📊 ${date} 데이터 수집 시작...`);

      // 경주 결과 수집
      const raceResults = await this.collectRaceResults(date);

      // 경주 계획 수집
      const racePlans = await this.collectRacePlans(date);

      // 확정 배당율 수집
      const dividendRates = await this.collectDividendRates(date);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result: CollectionResult = {
        date,
        raceResults,
        racePlans,
        dividendRates,
        success: true,
      };

      console.log(`✅ ${date} 데이터 수집 완료 (${duration}ms)`);
      return result;
    } catch (error: any) {
      const result: CollectionResult = {
        date,
        raceResults: 0,
        racePlans: 0,
        dividendRates: 0,
        success: false,
        error: error.message,
      };

      console.error(`❌ ${date} 데이터 수집 실패:`, error.message);
      return result;
    }
  }

  /**
   * 전체 기간 데이터 수집
   */
  async collectAllData(): Promise<void> {
    const startDate = moment(START_DATE, 'YYYYMMDD');
    const endDate = moment(END_DATE, 'YYYYMMDD');
    let currentDate = startDate.clone();

    console.log(
      `\n📚 총 ${endDate.diff(startDate, 'days') + 1}일 데이터 수집 시작`
    );

    while (currentDate.isSameOrBefore(endDate)) {
      const dateStr = currentDate.format('YYYYMMDD');

      try {
        const result = await this.collectDataForDate(dateStr);
        this.results.push(result);
        this.totalProcessed++;

        if (!result.success) {
          this.totalErrors++;
        }

        // 진행률 표시
        const progress = (
          (this.totalProcessed / (endDate.diff(startDate, 'days') + 1)) *
          100
        ).toFixed(2);
        console.log(
          `📈 진행률: ${progress}% (${this.totalProcessed}/${endDate.diff(startDate, 'days') + 1})`
        );

        // API 호출 제한을 위한 딜레이 (1초)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ ${dateStr} 처리 중 예상치 못한 오류:`, error);
        this.totalErrors++;
      }

      currentDate.add(1, 'day');
    }

    this.printSummary();
  }

  /**
   * 결과 요약 출력
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 데이터 수집 완료 요약');
    console.log('='.repeat(60));

    const totalDays = this.results.length;
    const successfulDays = this.results.filter(r => r.success).length;
    const failedDays = this.totalErrors;

    console.log(`📅 총 처리 일수: ${totalDays}일`);
    console.log(`✅ 성공: ${successfulDays}일`);
    console.log(`❌ 실패: ${failedDays}일`);
    console.log(
      `📈 성공률: ${((successfulDays / totalDays) * 100).toFixed(2)}%`
    );

    // 데이터 타입별 통계
    const totalRaceResults = this.results.reduce(
      (sum, r) => sum + r.raceResults,
      0
    );
    const totalRacePlans = this.results.reduce(
      (sum, r) => sum + r.racePlans,
      0
    );
    const totalDividendRates = this.results.reduce(
      (sum, r) => sum + r.dividendRates,
      0
    );

    console.log('\n📊 데이터 타입별 통계:');
    console.log(`🏁 경주 결과: ${totalRaceResults}건`);
    console.log(`📋 경주 계획: ${totalRacePlans}건`);
    console.log(`💰 확정 배당율: ${totalDividendRates}건`);

    // 실패한 날짜들
    const failedDates = this.results.filter(r => !r.success).map(r => r.date);
    if (failedDates.length > 0) {
      console.log('\n❌ 실패한 날짜들:');
      failedDates.forEach(date => console.log(`  - ${date}`));
    }

    console.log('\n⏰ 완료 시간:', new Date().toISOString());
    console.log('='.repeat(60));
  }

  /**
   * 특정 기간만 수집 (테스트용)
   */
  async collectPeriod(startDate: string, endDate: string): Promise<void> {
    console.log(`\n🔬 테스트 모드: ${startDate} ~ ${endDate} 기간만 수집`);

    const start = moment(startDate, 'YYYYMMDD');
    const end = moment(endDate, 'YYYYMMDD');
    let currentDate = start.clone();

    while (currentDate.isSameOrBefore(end)) {
      const dateStr = currentDate.format('YYYYMMDD');
      const result = await this.collectDataForDate(dateStr);
      this.results.push(result);
      currentDate.add(1, 'day');

      // 테스트 모드에서는 딜레이를 줄임
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.printSummary();
  }
}

// 스크립트 실행
async function main() {
  const collector = new HistoricalDataCollector();

  try {
    // 전체 기간 수집
    await collector.collectAllData();

    // 또는 특정 기간만 테스트하려면:
    // await collector.collectPeriod('20240901', '20240905');
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

export { HistoricalDataCollector };
