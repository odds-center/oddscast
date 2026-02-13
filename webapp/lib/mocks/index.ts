/**
 * Mock API — DB 없이 개발/데모용
 * NEXT_PUBLIC_USE_MOCK=true 시 활성화
 */

export const USE_MOCK = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_USE_MOCK === 'true' || process.env.NEXT_PUBLIC_USE_MOCK === '1')
  : (process.env.NEXT_PUBLIC_USE_MOCK === 'true' || process.env.NEXT_PUBLIC_USE_MOCK === '1');

export * from './data';
