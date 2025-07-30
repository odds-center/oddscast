import { logger } from '../utils/logger';
import { KraApiService } from './kraApiService';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../config/supabase';
import { QueryOptions, SyncResult, SyncStatus } from '@/types';

export class DataSyncService {
  private supabase: SupabaseClient;
  private kraApiService: KraApiService;

  constructor() {
    this.supabase = createClient();
    this.kraApiService = new KraApiService();
  }

  /**
   * 모든 데이터 동기화
   */
  async syncAllData(date?: string): Promise<SyncResult> {
    try {
      logger.info('Starting full data sync', { date });

      const syncDate = date || this.getCurrentDate();
      const results = [];

      // 경마 일정 동기화
      const racesResult = await this.syncRaces(syncDate);
      results.push({ type: 'races', ...racesResult });

      // 경마 결과 동기화
      const resultsResult = await this.syncResults(syncDate);
      results.push({ type: 'results', ...resultsResult });

      // 경주계획표 동기화
      const racePlansResult = await this.syncRacePlans(syncDate);
      results.push({ type: 'race-plans', ...racePlansResult });

      logger.info('Full data sync completed', { results });

      return {
        success: true,
        message: '모든 데이터 동기화가 완료되었습니다.',
        data: results,
      };
    } catch (error) {
      logger.error('Full data sync failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        message: '데이터 동기화 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 경마 일정 동기화
   */
  async syncRaces(date?: string): Promise<SyncResult> {
    try {
      const syncDate = date || this.getCurrentDate();
      logger.info('Starting races sync', { date: syncDate });

      // 한국마사회 API에서 경마 일정 데이터 가져오기
      const racesData = await this.kraApiService.getRaces(syncDate);

      if (!racesData || racesData.length === 0) {
        logger.warn('No races data found', { date: syncDate });
        return {
          success: true,
          message: '동기화할 경마 일정 데이터가 없습니다.',
          data: { count: 0 },
        };
      }

      // 기존 데이터 삭제 (해당 날짜)
      const { error: deleteError } = await this.supabase
        .from('races')
        .delete()
        .eq('date', syncDate);

      if (deleteError) {
        logger.error('Failed to delete existing races', { error: deleteError });
        throw new Error(`기존 경마 일정 삭제 실패: ${deleteError.message}`);
      }

      // 새 데이터 삽입
      const { data: insertedData, error: insertError } = await this.supabase
        .from('races')
        .insert(racesData)
        .select();

      if (insertError) {
        logger.error('Failed to insert races data', { error: insertError });
        throw new Error(`경마 일정 데이터 삽입 실패: ${insertError.message}`);
      }

      logger.info('Races sync completed', {
        date: syncDate,
        count: insertedData?.length || 0,
      });

      return {
        success: true,
        message: `${insertedData?.length || 0}개의 경마 일정이 동기화되었습니다.`,
        data: { count: insertedData?.length || 0 },
      };
    } catch (error) {
      logger.error('Races sync failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        message: '경마 일정 동기화 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 경마 결과 동기화
   */
  async syncResults(date?: string): Promise<SyncResult> {
    try {
      const syncDate = date || this.getCurrentDate();
      logger.info('Starting results sync', { date: syncDate });

      // 한국마사회 API에서 경마 결과 데이터 가져오기
      const resultsData = await this.kraApiService.getResults(syncDate);

      if (!resultsData || resultsData.length === 0) {
        logger.warn('No results data found', { date: syncDate });
        return {
          success: true,
          message: '동기화할 경마 결과 데이터가 없습니다.',
          data: { count: 0 },
        };
      }

      // 기존 데이터 삭제 (해당 날짜)
      const { error: deleteError } = await this.supabase
        .from('results')
        .delete()
        .eq('race_date', syncDate);

      if (deleteError) {
        logger.error('Failed to delete existing results', {
          error: deleteError,
        });
        throw new Error(`기존 경마 결과 삭제 실패: ${deleteError.message}`);
      }

      // 새 데이터 삽입
      const { data: insertedData, error: insertError } = await this.supabase
        .from('results')
        .insert(resultsData)
        .select();

      if (insertError) {
        logger.error('Failed to insert results data', { error: insertError });
        throw new Error(`경마 결과 데이터 삽입 실패: ${insertError.message}`);
      }

      logger.info('Results sync completed', {
        date: syncDate,
        count: insertedData?.length || 0,
      });

      return {
        success: true,
        message: `${insertedData?.length || 0}개의 경마 결과가 동기화되었습니다.`,
        data: { count: insertedData?.length || 0 },
      };
    } catch (error) {
      logger.error('Results sync failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        message: '경마 결과 동기화 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 경주계획표 동기화
   */
  async syncRacePlans(date?: string): Promise<SyncResult> {
    try {
      const syncDate = date || this.getCurrentDate();
      logger.info('Starting race plans sync', { date: syncDate });

      // 한국마사회 API에서 경주계획표 데이터 가져오기
      const racePlansData = await this.kraApiService.getRacePlans(syncDate);

      if (!racePlansData || racePlansData.length === 0) {
        logger.warn('No race plans data found', { date: syncDate });
        return {
          success: true,
          message: '동기화할 경주계획표 데이터가 없습니다.',
          data: { count: 0 },
        };
      }

      // 기존 데이터 삭제 (해당 날짜)
      const { error: deleteError } = await this.supabase
        .from('race_plans')
        .delete()
        .eq('race_date', syncDate);

      if (deleteError) {
        logger.error('Failed to delete existing race plans', {
          error: deleteError,
        });
        throw new Error(`기존 경주계획표 삭제 실패: ${deleteError.message}`);
      }

      // 새 데이터 삽입
      const { data: insertedData, error: insertError } = await this.supabase
        .from('race_plans')
        .insert(racePlansData)
        .select();

      if (insertError) {
        logger.error('Failed to insert race plans data', {
          error: insertError,
        });
        throw new Error(`경주계획표 데이터 삽입 실패: ${insertError.message}`);
      }

      logger.info('Race plans sync completed', {
        date: syncDate,
        count: insertedData?.length || 0,
      });

      return {
        success: true,
        message: `${insertedData?.length || 0}개의 경주계획표가 동기화되었습니다.`,
        data: { count: insertedData?.length || 0 },
      };
    } catch (error) {
      logger.error('Race plans sync failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        message: '경주계획표 동기화 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 경마 일정 데이터 조회
   */
  async getRaces(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase
        .from('races')
        .select('*')
        .order('date', { ascending: false });

      if (options.date) {
        query = query.eq('date', options.date);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch races', { error });
        throw new Error(`경마 일정 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get races', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * 경마 결과 데이터 조회
   */
  async getResults(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase
        .from('results')
        .select('*')
        .order('race_date', { ascending: false })
        .order('race_number', { ascending: true });

      if (options.date) {
        query = query.eq('race_date', options.date);
      }

      if (options.raceId) {
        query = query.eq('race_id', options.raceId);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch results', { error });
        throw new Error(`경마 결과 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get results', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * 경주계획표 데이터 조회
   */
  async getRacePlans(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase
        .from('race_plans')
        .select('*')
        .order('race_date', { ascending: false })
        .order('race_number', { ascending: true });

      if (options.date) {
        query = query.eq('race_date', options.date);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch race plans', { error });
        throw new Error(`경주계획표 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get race plans', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * 동기화 상태 확인
   */
  async getSyncStatus(date?: string): Promise<SyncStatus> {
    try {
      const checkDate = date || this.getCurrentDate();

      // 각 테이블의 데이터 개수 확인
      const [racesCount, resultsCount, racePlansCount] = await Promise.all([
        this.getTableCount('races', checkDate),
        this.getTableCount('results', checkDate),
        this.getTableCount('race_plans', checkDate),
      ]);

      // 마지막 동기화 시간 확인 (간단히 현재 시간으로 설정)
      const lastSync = new Date().toISOString();

      return {
        lastSync,
        racesCount,
        resultsCount,
        racePlansCount,
        isUpToDate: racesCount > 0 || resultsCount > 0 || racePlansCount > 0,
      };
    } catch (error) {
      logger.error('Failed to get sync status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * 테이블의 특정 날짜 데이터 개수 조회
   */
  private async getTableCount(
    tableName: string,
    date: string
  ): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('race_date', date);

      if (error) {
        logger.error(`Failed to get count for ${tableName}`, { error });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error(`Error getting count for ${tableName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * 현재 날짜 문자열 반환 (YYYY-MM-DD)
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0] || '';
  }
}
