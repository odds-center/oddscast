/**
 * JWT 토큰 검증 유틸리티
 */

/**
 * JWT 토큰이 만료되었는지 확인
 * @param token JWT 토큰
 * @returns 만료되었으면 true, 아니면 false
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  try {
    // JWT는 header.payload.signature 형식
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      return true;
    }

    // payload 파싱
    const payload = JSON.parse(atob(parts[1]));

    if (!payload.exp) {
      console.warn('Token has no expiration');
      return false; // 만료 시간이 없으면 유효하다고 간주
    }

    // 현재 시간 (초 단위)
    const currentTime = Math.floor(Date.now() / 1000);

    // 만료 시간과 비교
    const isExpired = currentTime >= payload.exp;

    if (isExpired) {
      console.log('🚫 Token expired:', {
        currentTime,
        expTime: payload.exp,
        expiredBy: currentTime - payload.exp,
      });
    }

    return isExpired;
  } catch (error) {
    console.error('Token validation error:', error);
    return true; // 에러가 발생하면 만료된 것으로 간주
  }
}

/**
 * JWT 토큰에서 사용자 정보 추출
 * @param token JWT 토큰
 * @returns 사용자 정보 또는 null
 */
export function decodeToken(token: string | null): any | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

/**
 * 토큰의 남은 시간 계산 (초 단위)
 * @param token JWT 토큰
 * @returns 남은 시간 (초) 또는 0
 */
export function getTokenRemainingTime(token: string | null): number {
  if (!token) return 0;

  try {
    const payload = decodeToken(token);
    if (!payload?.exp) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = payload.exp - currentTime;

    return Math.max(0, remainingTime);
  } catch (error) {
    console.error('Token remaining time error:', error);
    return 0;
  }
}
