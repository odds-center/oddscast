import { server } from './server';

// MSW 서버 초기화
export function initMockServer() {
  // __DEV__ 모드에서만 mock 서버 활성화
  if (__DEV__ && typeof window !== 'undefined') {
    try {
      server.listen({
        onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 실제 API로 전달
      });

      console.log('🔶 Mock Service Worker 시작됨');
    } catch (error) {
      console.warn('MSW 초기화 실패:', error);
    }
  }
}

// 앱 종료 시 서버 정리
export function cleanupMockServer() {
  if (__DEV__) {
    server.close();
    console.log('🔶 Mock Service Worker 종료됨');
  }
}
