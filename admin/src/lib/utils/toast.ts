/**
 * Toast 알림 유틸리티
 * react-hot-toast 래퍼
 */
import toast from 'react-hot-toast';

/**
 * 성공 알림
 */
export const showSuccess = (message: string) => {
  toast.success(message);
};

/**
 * 에러 알림
 */
export const showError = (message: string) => {
  toast.error(message);
};

/**
 * 일반 알림
 */
export const showInfo = (message: string) => {
  toast(message);
};

/**
 * 로딩 알림
 */
export const showLoading = (message: string) => {
  return toast.loading(message);
};

/**
 * 로딩 완료
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Promise 기반 알림
 */
export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages);
};

/**
 * 커스텀 알림
 */
export const showCustom = (
  message: string,
  options?: {
    icon?: string;
    duration?: number;
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right';
  }
) => {
  toast(message, options);
};

// 기본 export
const toastUtils = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  loading: showLoading,
  dismiss: dismissToast,
  promise: showPromise,
  custom: showCustom,
};

export default toastUtils;
