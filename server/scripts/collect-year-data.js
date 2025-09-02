const axios = require('axios');
const mysql = require('mysql2/promise');

// 설정
const START_DATE = '20240902'; // 2024년 9월 2일 (1년 전)
const END_DATE = '20250902'; // 2025년 9월 2일 (현재)

// 서버 API 설정
const SERVER_API_BASE_URL = 'http://localhost:3002/api';

// MySQL 연결 설정
const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'goldenrace_user',
  password: 'goldenrace_password',
  database: 'goldenrace',
};

// MySQL 연결
let dbConnection;

async function connectDB() {
  try {
    dbConnection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ MySQL 연결 성공');
  } catch (error) {
    console.error('❌ MySQL 연결 실패:', error.message);
    throw error;
  }
}

async function closeDB() {
  if (dbConnection) {
    await dbConnection.end();
    console.log('🔌 MySQL 연결 종료');
  }
}

// 날짜 유틸리티 함수
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function parseDate(dateStr) {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}

// 서버 API 호출 함수
async function callServerApi(endpoint, params = {}) {
  try {
    const url = `${SERVER_API_BASE_URL}${endpoint}`;
    const response = await axios.post(url, null, { params });
    return response.data;
  } catch (error) {
    console.error(
      `❌ 서버 API 호출 실패 (${endpoint}):`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// 특정 날짜의 모든 데이터 수집
async function collectDataForDate(date) {
  console.log(`\n📊 ${date} 데이터 수집 시작...`);

  const results = {
    date,
    raceResults: 0,
    racePlans: 0,
    dividendRates: 0,
    success: true,
    errors: [],
  };

  try {
    // 경주 결과 수집
    try {
      await callServerApi('/batch/kra-data/collect-daily-results', { date });
      results.raceResults = 1;
      console.log(`✅ ${date} 경주 결과 수집 완료`);
    } catch (error) {
      results.errors.push(`경주 결과: ${error.message}`);
      console.log(`⚠️ ${date} 경주 결과 수집 실패`);
    }

    // 경주 계획 수집
    try {
      await callServerApi('/batch/kra-data/collect-daily-plans', { date });
      results.racePlans = 1;
      console.log(`✅ ${date} 경주 계획 수집 완료`);
    } catch (error) {
      results.errors.push(`경주 계획: ${error.message}`);
      console.log(`⚠️ ${date} 경주 계획 수집 실패`);
    }

    // 확정 배당율 수집
    try {
      await callServerApi('/batch/kra-data/collect-daily-dividends', { date });
      results.dividendRates = 1;
      console.log(`✅ ${date} 확정 배당율 수집 완료`);
    } catch (error) {
      results.errors.push(`확정 배당율: ${error.message}`);
      console.log(`⚠️ ${date} 확정 배당율 수집 실패`);
    }
  } catch (error) {
    results.success = false;
    results.errors.push(`일반 오류: ${error.message}`);
  }

  return results;
}

// 전체 기간 데이터 수집
async function collectAllData() {
  console.log('🚀 KRA 과거 데이터 수집기 시작');
  console.log(`📅 수집 기간: ${START_DATE} ~ ${END_DATE}`);
  console.log('⏰ 시작 시간:', new Date().toISOString());

  const startDate = parseDate(START_DATE);
  const endDate = parseDate(END_DATE);
  const totalDays =
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  console.log(`\n📚 총 ${totalDays}일 데이터 수집 시작`);

  const allResults = [];
  let currentDate = new Date(startDate);
  let processedCount = 0;
  let errorCount = 0;

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);

    try {
      const result = await collectDataForDate(dateStr);
      allResults.push(result);
      processedCount++;

      if (!result.success || result.errors.length > 0) {
        errorCount++;
      }

      // 진행률 표시
      const progress = ((processedCount / totalDays) * 100).toFixed(2);
      console.log(`📈 진행률: ${progress}% (${processedCount}/${totalDays})`);

      // API 호출 제한을 위한 딜레이 (1초)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ ${dateStr} 처리 중 예상치 못한 오류:`, error.message);
      errorCount++;
    }

    currentDate = addDays(currentDate, 1);
  }

  // 결과 요약 출력
  printSummary(allResults, processedCount, errorCount);
}

// 결과 요약 출력
function printSummary(results, totalProcessed, totalErrors) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 데이터 수집 완료 요약');
  console.log('='.repeat(60));

  const successfulDays = results.filter(
    r => r.success && r.errors.length === 0
  ).length;
  const failedDays = totalErrors;

  console.log(`📅 총 처리 일수: ${totalProcessed}일`);
  console.log(`✅ 성공: ${successfulDays}일`);
  console.log(`❌ 실패: ${failedDays}일`);
  console.log(
    `📈 성공률: ${((successfulDays / totalProcessed) * 100).toFixed(2)}%`
  );

  // 데이터 타입별 통계
  const totalRaceResults = results.reduce((sum, r) => sum + r.raceResults, 0);
  const totalRacePlans = results.reduce((sum, r) => sum + r.racePlans, 0);
  const totalDividendRates = results.reduce(
    (sum, r) => sum + r.dividendRates,
    0
  );

  console.log('\n📊 데이터 타입별 통계:');
  console.log(`🏁 경주 결과: ${totalRaceResults}건`);
  console.log(`📋 경주 계획: ${totalRacePlans}건`);
  console.log(`💰 확정 배당율: ${totalDividendRates}건`);

  // 실패한 날짜들
  const failedDates = results
    .filter(r => !r.success || r.errors.length > 0)
    .map(r => r.date);
  if (failedDates.length > 0) {
    console.log('\n❌ 실패한 날짜들:');
    failedDates.forEach(date => console.log(`  - ${date}`));
  }

  console.log('\n⏰ 완료 시간:', new Date().toISOString());
  console.log('='.repeat(60));
}

// 특정 기간만 수집 (테스트용)
async function collectPeriod(startDate, endDate) {
  console.log(`\n🔬 테스트 모드: ${startDate} ~ ${endDate} 기간만 수집`);

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const allResults = [];
  let currentDate = new Date(start);
  let processedCount = 0;

  while (currentDate <= end) {
    const dateStr = formatDate(currentDate);
    const result = await collectDataForDate(dateStr);
    allResults.push(result);
    processedCount++;

    // 테스트 모드에서는 딜레이를 줄임
    await new Promise(resolve => setTimeout(resolve, 500));
    currentDate = addDays(currentDate, 1);
  }

  printSummary(allResults, processedCount, 0);
}

// 메인 실행 함수
async function main() {
  try {
    // 명령행 인수 확인
    const args = process.argv.slice(2);

    if (args.includes('--test')) {
      // 테스트 모드: 최근 5일만 수집
      const testEndDate = formatDate(new Date());
      const testStartDate = formatDate(addDays(new Date(), -5));
      await collectPeriod(testStartDate, testEndDate);
    } else if (args.includes('--period') && args.length >= 3) {
      // 특정 기간 수집
      const startDate = args[args.indexOf('--period') + 1];
      const endDate = args[args.indexOf('--period') + 2];
      await collectPeriod(startDate, endDate);
    } else {
      // 전체 기간 수집
      await collectAllData();
    }
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  collectAllData,
  collectPeriod,
  collectDataForDate,
};
