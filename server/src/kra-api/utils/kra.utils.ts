/**
 * KRA API 유틸리티 함수
 * 한국마사회 API 관련 공통 유틸리티 함수들을 제공합니다.
 */

import {
  KRA_MEETS,
  KRA_RACE_GRADES,
  KRA_BET_TYPES,
  KRA_WEATHER_CODES,
  KRA_TRACK_CONDITIONS,
  KRA_API_ERROR_MESSAGES,
  MeetCode,
} from '../constants/kra.constants';

// ============================================
// 날짜 관련 유틸리티
// ============================================

/**
 * 현재 날짜를 YYYYMMDD 형식으로 반환
 */
export function getCurrentDate(): string {
  const today = new Date();
  return formatDate(today);
}

/**
 * Date 객체를 YYYYMMDD 형식으로 변환
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * YYYYMMDD 문자열을 Date 객체로 변환
 */
export function parseDate(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}

/**
 * 날짜 범위 생성 (YYYYMMDD 배열)
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const dates: string[] = [];

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(formatDate(date));
  }

  return dates;
}

/**
 * 날짜에서 년도 추출 (YYYY)
 */
export function getYear(date: string): string {
  return date.substring(0, 4);
}

/**
 * 날짜에서 년월 추출 (YYYYMM)
 */
export function getYearMonth(date: string): string {
  return date.substring(0, 6);
}

/**
 * 날짜에서 일 추출 (DD)
 */
export function getDay(date: string): string {
  return date.substring(6, 8);
}

// ============================================
// 코드 변환 유틸리티
// ============================================

/**
 * 경마장 코드를 이름으로 변환
 */
export function getMeetName(meetCode: string): string {
  const meet = Object.values(KRA_MEETS).find(m => m.code === meetCode);
  return meet?.name || '알 수 없음';
}

/**
 * 경마장 코드를 전체 이름으로 변환
 */
export function getMeetFullName(meetCode: string): string {
  const meet = Object.values(KRA_MEETS).find(m => m.code === meetCode);
  return meet?.fullName || '알 수 없음';
}

/**
 * 경마장 이름으로 코드 찾기
 */
export function getMeetCode(meetName: string): MeetCode | null {
  const meet = Object.values(KRA_MEETS).find(
    m => m.name === meetName || m.fullName === meetName
  );
  return (meet?.code as MeetCode) || null;
}

/**
 * 경주 등급 코드를 이름으로 변환
 */
export function getRaceGradeName(gradeCode: string): string {
  const grade = Object.values(KRA_RACE_GRADES).find(g => g.code === gradeCode);
  return grade?.name || gradeCode;
}

/**
 * 베팅 타입 코드를 이름으로 변환
 */
export function getBetTypeName(betTypeCode: string): string {
  const betType = Object.values(KRA_BET_TYPES).find(
    bt => bt.code === betTypeCode || bt.shortCode === betTypeCode
  );
  return betType?.name || betTypeCode;
}

/**
 * 날씨 코드를 이름으로 변환
 */
export function getWeatherName(weatherCode: string): string {
  const weather = Object.values(KRA_WEATHER_CODES).find(
    w => w.code === weatherCode
  );
  return weather?.name || '알 수 없음';
}

/**
 * 주로 상태 코드를 이름으로 변환
 */
export function getTrackConditionName(conditionCode: string): string {
  const condition = Object.values(KRA_TRACK_CONDITIONS).find(
    tc => tc.code === conditionCode
  );
  return condition?.name || '알 수 없음';
}

// ============================================
// API 응답 처리 유틸리티
// ============================================

/**
 * API 에러 코드를 메시지로 변환
 */
export function getErrorMessage(errorCode: string): string {
  return KRA_API_ERROR_MESSAGES[errorCode] || '알 수 없는 오류';
}

/**
 * API 응답이 성공인지 확인
 */
export function isSuccessResponse(resultCode: string): boolean {
  return resultCode === '00';
}

/**
 * API 응답 데이터를 안전하게 추출
 */
export function extractItems<T = any>(response: any): T[] {
  if (!response?.response?.body?.items) {
    return [];
  }

  const items = response.response.body.items;

  // 배열인 경우
  if (Array.isArray(items)) {
    return items;
  }

  // 객체이고 item 속성을 가진 경우
  if (typeof items === 'object' && 'item' in items) {
    const item = items.item;
    return Array.isArray(item) ? item : [item];
  }

  // 빈 문자열인 경우
  if (items === '') {
    return [];
  }

  return [];
}

// ============================================
// 데이터 검증 유틸리티
// ============================================

/**
 * 날짜 형식 검증 (YYYYMMDD)
 */
export function isValidDateFormat(date: string): boolean {
  if (!/^\d{8}$/.test(date)) {
    return false;
  }

  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(4, 6));
  const day = parseInt(date.substring(6, 8));

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // 실제 날짜 유효성 검사
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * 경마장 코드 검증
 */
export function isValidMeetCode(meetCode: string): boolean {
  return Object.values(KRA_MEETS).some(m => m.code === meetCode);
}

/**
 * 경주 번호 검증 (1-12)
 */
export function isValidRaceNumber(rcNo: number | string): boolean {
  const num = typeof rcNo === 'string' ? parseInt(rcNo) : rcNo;
  return num >= 1 && num <= 12;
}

// ============================================
// ID 생성 유틸리티
// ============================================

/**
 * 경주 고유 ID 생성
 * 형식: {meet}_{rcDate}_{rcNo}
 */
export function generateRaceId(
  meet: string,
  rcDate: string,
  rcNo: string | number
): string {
  return `${meet}_${rcDate}_${rcNo}`;
}

/**
 * 경주 결과 고유 ID 생성
 * 형식: {meet}_{rcDate}_{rcNo}_{ord}
 */
export function generateResultId(
  meet: string,
  rcDate: string,
  rcNo: string | number,
  ord: string | number
): string {
  return `${meet}_${rcDate}_${rcNo}_${ord}`;
}

/**
 * 배당율 고유 ID 생성
 * 형식: {meet}_{rcDate}_{rcNo}_{winType}
 */
export function generateDividendId(
  meet: string,
  rcDate: string,
  rcNo: string | number,
  winType: string
): string {
  return `${meet}_${rcDate}_${rcNo}_${winType}`;
}

/**
 * 출전표 고유 ID 생성
 * 형식: {meet}_{rcDate}_{rcNo}_{hrNo}
 */
export function generateEntryId(
  meet: string,
  rcDate: string,
  rcNo: string | number,
  hrNo: string
): string {
  return `${meet}_${rcDate}_${rcNo}_${hrNo}`;
}

// ============================================
// 데이터 정제 유틸리티
// ============================================

/**
 * 마체중 문자열 파싱 (예: "502(-2)" -> { weight: 502, change: -2 })
 */
export function parseHorseWeight(wgHr: string): {
  weight: number;
  change: number;
} {
  const match = wgHr.match(/(\d+)\(([\+\-]?\d+)\)/);
  if (!match) {
    return { weight: parseInt(wgHr) || 0, change: 0 };
  }
  return {
    weight: parseInt(match[1]),
    change: parseInt(match[2]),
  };
}

/**
 * 경주 시간 파싱 (초 단위를 분:초 형식으로)
 */
export function formatRaceTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${minutes}:${secs.padStart(4, '0')}`;
}

/**
 * 금액 포맷팅 (1000 단위 콤마)
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseInt(amount) : amount;
  return num.toLocaleString('ko-KR');
}

/**
 * 배당률 포맷팅
 */
export function formatOdds(odds: number | string): string {
  const num = typeof odds === 'string' ? parseFloat(odds) : odds;
  return num.toFixed(1);
}

// ============================================
// URL 및 파라미터 유틸리티
// ============================================

/**
 * API 요청 파라미터 생성
 */
export function buildApiParams(
  params: Record<string, any>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      result[key] = String(value);
    }
  }

  return result;
}

/**
 * Service Key URL 인코딩
 */
export function encodeServiceKey(serviceKey: string): string {
  return encodeURIComponent(serviceKey);
}

/**
 * Service Key URL 디코딩
 */
export function decodeServiceKey(encodedKey: string): string {
  return decodeURIComponent(encodedKey);
}

// ============================================
// 로깅 유틸리티
// ============================================

/**
 * API 요청 로그 포맷팅
 */
export function formatRequestLog(
  endpoint: string,
  params: Record<string, any>
): string {
  const sanitizedParams = { ...params };
  if (sanitizedParams.ServiceKey) {
    sanitizedParams.ServiceKey = '***';
  }
  return `[KRA API] ${endpoint} | Params: ${JSON.stringify(sanitizedParams)}`;
}

/**
 * API 응답 로그 포맷팅
 */
export function formatResponseLog(
  endpoint: string,
  itemCount: number,
  duration: number
): string {
  return `[KRA API] ${endpoint} | Items: ${itemCount} | Duration: ${duration}ms`;
}

// ============================================
// 타입 가드
// ============================================

/**
 * 경주 데이터 타입 가드
 */
export function isRaceData(data: any): data is {
  meet: string;
  rcDate: string;
  rcNo: string;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.meet === 'string' &&
    typeof data.rcDate === 'string' &&
    (typeof data.rcNo === 'string' || typeof data.rcNo === 'number')
  );
}
