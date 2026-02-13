/**
 * KRA API 통합 서비스
 * 모든 KRA API 서비스를 하나로 통합하여 제공합니다.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KraRaceRecordsService,
  ProcessedRaceRecord,
  RaceRecordsParams,
} from './services/kra-race-records.service';
import {
  KraEntrySheetService,
  ProcessedEntrySheet,
  EntrySheetParams,
} from './services/kra-entry-sheet.service';
import {
  KraDividendRatesService,
  ProcessedDividendRate,
  DividendRatesParams,
  RaceDividends,
} from './services/kra-dividend-rates.service';
import {
  KraRacePlansService,
  ProcessedRacePlan,
  RacePlansParams,
  RaceSchedule,
} from './services/kra-race-plans.service';
import { getCurrentDate } from './utils/kra.utils';

/**
 * 통합 API 상태
 */
export interface KraApiStatus {
  isHealthy: boolean;
  services: {
    raceRecords: {
      isAvailable: boolean;
      responseTime: number;
      error?: string;
    };
    entrySheet: {
      isAvailable: boolean;
      responseTime: number;
      error?: string;
    };
    dividendRates: {
      isAvailable: boolean;
      responseTime: number;
      error?: string;
    };
    racePlans: {
      isAvailable: boolean;
      responseTime: number;
      error?: string;
    };
  };
  lastCheck: string;
}

/**
 * 경주 완전한 정보 (모든 데이터 통합)
 */
export interface CompleteRaceInfo {
  // 기본 경주 정보
  raceId: string;
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: number;
  rcName: string;

  // 경주 계획 정보
  plan?: ProcessedRacePlan;

  // 출전표 정보
  entries: ProcessedEntrySheet[];

  // 경주 결과
  results: ProcessedRaceRecord[];

  // 배당율 정보
  dividends: ProcessedDividendRate[];

  // 통계 정보
  statistics: {
    entryCount: number;
    hasResults: boolean;
    hasDividends: boolean;
    totalPrize: number;
  };
}

@Injectable()
export class KraApiIntegratedService {
  private readonly logger = new Logger(KraApiIntegratedService.name);

  constructor(
    private readonly raceRecordsService: KraRaceRecordsService,
    private readonly entrySheetService: KraEntrySheetService,
    private readonly dividendRatesService: KraDividendRatesService,
    private readonly racePlansService: KraRacePlansService,
    private readonly configService: ConfigService
  ) {
    this.logger.log('KRA API Integrated Service initialized');
  }

  // ============================================
  // 경주기록 API
  // ============================================

  /**
   * 경주기록 조회
   */
  async getRaceRecords(
    params?: RaceRecordsParams
  ): Promise<ProcessedRaceRecord[]> {
    return this.raceRecordsService.getRaceRecords(params);
  }

  /**
   * 특정 경주 결과 조회
   */
  async getRaceResults(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<ProcessedRaceRecord[]> {
    return this.raceRecordsService.getRaceResults(rcDate, meet, rcNo);
  }

  /**
   * 일일 경주 기록 조회
   */
  async getDailyRaceRecords(
    rcDate: string,
    meet?: string
  ): Promise<ProcessedRaceRecord[]> {
    return this.raceRecordsService.getDailyRaceRecords(rcDate, meet);
  }

  // ============================================
  // 출전표 API
  // ============================================

  /**
   * 출전표 조회
   */
  async getEntrySheet(
    params?: EntrySheetParams
  ): Promise<ProcessedEntrySheet[]> {
    return this.entrySheetService.getEntrySheet(params);
  }

  /**
   * 특정 경주 출전표 조회
   */
  async getRaceEntries(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<ProcessedEntrySheet[]> {
    return this.entrySheetService.getRaceEntries(rcDate, meet, rcNo);
  }

  /**
   * 일일 출전표 조회
   */
  async getDailyEntrySheets(
    rcDate: string,
    meet?: string
  ): Promise<ProcessedEntrySheet[]> {
    return this.entrySheetService.getDailyEntrySheets(rcDate, meet);
  }

  /**
   * 특정 말 출전 정보 조회
   */
  async getHorseEntries(
    hrNo: string,
    rcDate?: string
  ): Promise<ProcessedEntrySheet[]> {
    return this.entrySheetService.getHorseEntries(hrNo, rcDate);
  }

  // ============================================
  // 확정배당율 API
  // ============================================

  /**
   * 확정배당율 조회
   */
  async getDividendRates(
    params?: DividendRatesParams
  ): Promise<ProcessedDividendRate[]> {
    return this.dividendRatesService.getDividendRates(params);
  }

  /**
   * 특정 경주 배당율 조회
   */
  async getRaceDividends(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<ProcessedDividendRate[]> {
    return this.dividendRatesService.getRaceDividends(rcDate, meet, rcNo);
  }

  /**
   * 일일 배당율 조회
   */
  async getDailyDividendRates(
    rcDate: string,
    meet?: string
  ): Promise<ProcessedDividendRate[]> {
    return this.dividendRatesService.getDailyDividendRates(rcDate, meet);
  }

  /**
   * 경주별 배당율 그룹화
   */
  async getGroupedDividends(
    rcDate: string,
    meet?: string
  ): Promise<RaceDividends[]> {
    return this.dividendRatesService.getGroupedDividends(rcDate, meet);
  }

  // ============================================
  // 경주계획표 API
  // ============================================

  /**
   * 경주계획표 조회
   */
  async getRacePlans(params?: RacePlansParams): Promise<ProcessedRacePlan[]> {
    return this.racePlansService.getRacePlans(params);
  }

  /**
   * 특정 경주 계획 조회
   */
  async getRacePlan(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<ProcessedRacePlan | null> {
    return this.racePlansService.getRacePlan(rcDate, meet, rcNo);
  }

  /**
   * 일일 경주 계획 조회
   */
  async getDailyRacePlans(
    rcDate: string,
    meet?: string
  ): Promise<ProcessedRacePlan[]> {
    return this.racePlansService.getDailyRacePlans(rcDate, meet);
  }

  /**
   * 경주 일정 조회
   */
  async getRaceSchedule(rcDate: string): Promise<RaceSchedule> {
    return this.racePlansService.getRaceSchedule(rcDate);
  }

  /**
   * 향후 경주 일정 조회
   */
  async getUpcomingRacePlans(days?: number): Promise<RaceSchedule[]> {
    return this.racePlansService.getUpcomingRacePlans(days);
  }

  // ============================================
  // 통합 API
  // ============================================

  /**
   * 특정 경주의 완전한 정보 조회
   */
  async getCompleteRaceInfo(
    rcDate: string,
    meet: string,
    rcNo: string | number
  ): Promise<CompleteRaceInfo> {
    try {
      // 병렬로 모든 정보 조회
      const [plan, entries, results, dividends] = await Promise.all([
        this.getRacePlan(rcDate, meet, rcNo).catch(() => null),
        this.getRaceEntries(rcDate, meet, rcNo).catch(() => []),
        this.getRaceResults(rcDate, meet, rcNo).catch(() => []),
        this.getRaceDividends(rcDate, meet, rcNo).catch(() => []),
      ]);

      // 경주 ID 생성
      const raceId = `${meet}_${rcDate}_${rcNo}`;
      const meetName =
        entries[0]?.meetName || results[0]?.meetName || plan?.meetName || '';
      const rcName =
        plan?.rcName || entries[0]?.rcName || results[0]?.rcName || '';

      // 통계 계산
      const totalPrize = plan?.rcPrize || results[0]?.prize || 0;

      const completeInfo: CompleteRaceInfo = {
        raceId,
        meet,
        meetName,
        rcDate,
        rcNo: parseInt(String(rcNo)),
        rcName,
        plan: plan || undefined,
        entries,
        results,
        dividends,
        statistics: {
          entryCount: entries.length,
          hasResults: results.length > 0,
          hasDividends: dividends.length > 0,
          totalPrize,
        },
      };

      return completeInfo;
    } catch (error) {
      this.logger.error(`Failed to get complete race info: ${error.message}`, {
        rcDate,
        meet,
        rcNo,
      });
      throw error;
    }
  }

  /**
   * 일일 모든 경주 정보 조회
   */
  async getDailyCompleteRaceInfo(
    rcDate: string = getCurrentDate(),
    meet?: string
  ): Promise<CompleteRaceInfo[]> {
    try {
      // 일일 경주 계획 조회
      const plans = await this.getDailyRacePlans(rcDate, meet);

      // 각 경주의 완전한 정보 조회
      const completeInfos = await Promise.all(
        plans.map(plan =>
          this.getCompleteRaceInfo(plan.rcDate, plan.meet, plan.rcNo)
        )
      );

      return completeInfos;
    } catch (error) {
      this.logger.error(
        `Failed to get daily complete race info: ${error.message}`,
        {
          rcDate,
          meet,
        }
      );
      throw error;
    }
  }

  /**
   * 전체 API 상태 확인
   */
  async checkApiStatus(): Promise<KraApiStatus> {
    const [raceRecords, entrySheet, dividendRates, racePlans] =
      await Promise.all([
        this.raceRecordsService.checkApiStatus(),
        this.entrySheetService.checkApiStatus(),
        this.dividendRatesService.checkApiStatus(),
        this.racePlansService.checkApiStatus(),
      ]);

    const isHealthy =
      raceRecords.isAvailable &&
      entrySheet.isAvailable &&
      dividendRates.isAvailable &&
      racePlans.isAvailable;

    return {
      isHealthy,
      services: {
        raceRecords,
        entrySheet,
        dividendRates,
        racePlans,
      },
      lastCheck: new Date().toISOString(),
    };
  }
}
