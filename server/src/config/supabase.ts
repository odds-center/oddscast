import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from '@supabase/supabase-js';
import { logger } from '../utils/logger';

let supabaseClient: SupabaseClient | null = null;

/**
 * Supabase 클라이언트 생성
 */
export function createClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env['SUPABASE_URL'];
  const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error('Supabase configuration missing', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
    throw new Error('Supabase URL과 API 키가 필요합니다.');
  }

  try {
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });

    logger.info('Supabase client created successfully');
    return supabaseClient;
  } catch (error) {
    logger.error('Failed to create Supabase client', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error(
      `Supabase 클라이언트 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Supabase 클라이언트 인스턴스 반환
 */
export function getClient(): SupabaseClient {
  if (!supabaseClient) {
    return createClient();
  }
  return supabaseClient;
}

/**
 * Supabase 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = getClient();
    const { error } = await client
      .from('races')
      .select('count', { count: 'exact', head: true });

    if (error) {
      logger.error('Supabase connection test failed', { error });
      return false;
    }

    logger.info('Supabase connection test successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
