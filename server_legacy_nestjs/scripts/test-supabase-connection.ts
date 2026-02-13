#!/usr/bin/env ts-node
/**
 * PostgreSQL 연결 테스트 스크립트 (레거시)
 * 
 * 사용법:
 *   npm run test:db
 *   또는
 *   ts-node scripts/test-supabase-connection.ts (또는 npm run test:db)
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as dns from 'dns';

// DNS 서버 설정 (공용 DNS 사용)
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

// 환경변수 로드
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🔍 PostgreSQL 연결 테스트 시작...\n');

// 환경변수에서 연결 정보 가져오기
const getDbConfig = () => {
  // DATABASE_URL 우선 사용
  if (process.env.DATABASE_URL) {
    return { url: process.env.DATABASE_URL };
  }

  // 개별 환경변수로 조합
  const host = process.env.SUPABASE_DB_HOST;
  const port = process.env.SUPABASE_DB_PORT || '5432';
  const user = process.env.SUPABASE_DB_USER || 'postgres';
  const password = process.env.SUPABASE_DB_PASSWORD;
  const database = process.env.SUPABASE_DB_NAME || 'postgres';

  if (!host || !password) {
    throw new Error(
      '환경변수가 설정되지 않았습니다.\n' +
      '필수: SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD\n' +
      '또는 DATABASE_URL'
    );
  }

  return {
    host,
    port: parseInt(port, 10),
    user,
    password,
    database,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
    // IPv4/IPv6 자동 선택 (family 옵션 제거)
    // Direct connection은 IPv6만 지원하므로 자동 선택 필요
  };
};

const testConnection = async () => {
  const config = getDbConfig();
  const client = new Client(config as any);

  try {
    console.log('📋 연결 정보:');
    if ('url' in config) {
      // URL에서 민감한 정보 제거하여 표시
      const url = config.url.replace(/:[^:@]+@/, ':****@');
      console.log('  Connection URL:', url);
    } else {
      console.log('  Host:', config.host);
      console.log('  Port:', config.port);
      console.log('  User:', config.user);
      console.log('  Database:', config.database);
    }
    console.log('  SSL: enabled\n');

    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!\n');

    // 서버 정보 조회
    const versionResult = await client.query(
      'SELECT version(), current_database(), current_user, current_timestamp;'
    );
    const versionRow = versionResult.rows[0];

    console.log('📊 데이터베이스 정보:');
    console.log('  PostgreSQL Version:', versionRow.version.split(' ')[0], versionRow.version.split(' ')[1]);
    console.log('  Database:', versionRow.current_database);
    console.log('  User:', versionRow.current_user);
    console.log('  Server Time:', versionRow.current_timestamp);

    // 테이블 목록 조회
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`\n📋 생성된 테이블 (${tablesResult.rows.length}개):`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('  (테이블이 없습니다. 서버를 실행하여 테이블을 생성하세요.)');
    }

    // 연결 풀 정보
    const poolResult = await client.query(`
      SELECT count(*) as connection_count
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `);

    console.log(`\n🔌 현재 연결 수: ${poolResult.rows[0].connection_count}`);

    console.log('\n✅ 연결 테스트 성공!');
  } catch (err: any) {
    console.error('\n❌ 연결 실패!');
    console.error('오류:', err.message);
    if (err.code) console.error('에러 코드:', err.code);
    if (err.errno) console.error('Errno:', err.errno);
    
    console.error('\n💡 해결 방법:');
    console.error('1. 환경변수 확인 (.env 파일 또는 시스템 환경변수)');
    console.error('2. DB 호스팅 프로젝트 상태 확인 (대시보드에서 Active인지 확인)');
    console.error('3. 네트워크 연결 확인');
    console.error('4. Connection Pooling 사용 시 포트 6543 사용');
    
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
};

testConnection();

