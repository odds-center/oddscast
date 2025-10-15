import Toast, { ToastShowParams } from 'react-native-toast-message';

/**
 * Toast 알림 유틸리티
 *
 * Admin Panel과 동일한 구조로 사용자 피드백을 제공합니다.
 * console.log 대신 이 함수들을 사용하세요!
 */

// 기본 옵션
const defaultOptions: Partial<ToastShowParams> = {
  position: 'top',
  visibilityTime: 3000,
  autoHide: true,
  topOffset: 60,
};

/**
 * 성공 메시지 표시
 */
export const showSuccess = (message: string, title?: string) => {
  Toast.show({
    type: 'success',
    text1: title || '✅ 성공',
    text2: message,
    ...defaultOptions,
  });
};

/**
 * 에러 메시지 표시
 */
export const showError = (message: string, title?: string) => {
  Toast.show({
    type: 'error',
    text1: title || '❌ 오류',
    text2: message,
    ...defaultOptions,
    visibilityTime: 4000,
  });
};

/**
 * 경고 메시지 표시
 */
export const showWarning = (message: string, title?: string) => {
  Toast.show({
    type: 'info',
    text1: title || '⚠️ 주의',
    text2: message,
    ...defaultOptions,
  });
};

/**
 * 일반 정보 메시지 표시
 */
export const showInfo = (message: string, title?: string) => {
  Toast.show({
    type: 'info',
    text1: title || 'ℹ️ 안내',
    text2: message,
    ...defaultOptions,
  });
};

/**
 * Toast 숨기기
 */
export const hideToast = () => {
  Toast.hide();
};

/**
 * Promise 기반 Toast (로딩 → 성공/실패)
 */
export const showPromise = async <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> => {
  // 로딩 표시
  Toast.show({
    type: 'info',
    text1: '⏳ 처리 중...',
    text2: messages.loading,
    position: 'top',
    visibilityTime: 0,
    autoHide: false,
    topOffset: 60,
  });

  try {
    const result = await promise;
    // 성공
    Toast.show({
      type: 'success',
      text1: '✅ 완료',
      text2: messages.success,
      ...defaultOptions,
    });
    return result;
  } catch (error) {
    // 실패
    Toast.show({
      type: 'error',
      text1: '❌ 실패',
      text2: messages.error,
      ...defaultOptions,
      visibilityTime: 4000,
    });
    throw error;
  }
};

/**
 * 커스텀 Toast
 */
export const showCustom = (config: ToastShowParams) => {
  Toast.show({
    ...defaultOptions,
    ...config,
  });
};

// Default export
const toastUtils = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  hide: hideToast,
  promise: showPromise,
  custom: showCustom,
};

export default toastUtils;
