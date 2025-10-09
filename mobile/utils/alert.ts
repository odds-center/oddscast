import { Alert, Platform } from 'react-native';

// 전역 Alert 참조를 위한 변수
let globalAlertRef: {
  showAlert: (
    title: string,
    message: string,
    buttons?: {
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }[],
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => void;
} | null = null;

// Alert Provider에서 참조를 설정하는 함수
export const setGlobalAlertRef = (ref: typeof globalAlertRef) => {
  globalAlertRef = ref;
};

/**
 * OS별로 적절한 Alert 스타일을 적용합니다.
 */
const getAlertStyle = () => {
  if (Platform.OS === 'android') {
    return {
      cancelable: true,
      onDismiss: () => {},
    };
  }
  return {};
};

/**
 * 커스텀 Alert 또는 네이티브 Alert을 표시합니다.
 */
const showCustomAlert = (
  title: string,
  message: string,
  buttons: {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[] = [{ text: '확인' }],
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
) => {
  // 모든 플랫폼에서 커스텀 Alert 사용 (일관된 UI 제공)
  if (globalAlertRef) {
    globalAlertRef.showAlert(title, message, buttons, type);
    return;
  }

  // 폴백: 네이티브 Alert 사용 (AlertProvider가 없는 경우)
  const nativeButtons = buttons.map((button) => ({
    text: button.text,
    onPress: button.onPress,
    style: button.style as any,
  }));

  Alert.alert(title, message, nativeButtons);
};

/**
 * 성공 메시지를 표시합니다.
 */
export const showSuccessMessage = (message: string, title: string = '✨ 성공') => {
  showCustomAlert(title, message, [{ text: '확인' }], 'success');
};

/**
 * 에러 메시지를 표시합니다.
 */
export const showErrorMessage = (message: string, title: string = '⚠️ 오류') => {
  showCustomAlert(title, message, [{ text: '확인' }], 'error');
};

/**
 * 경고 메시지를 표시합니다.
 */
export const showWarningMessage = (message: string, title: string = '경고') => {
  showCustomAlert(title, message, [{ text: '확인' }], 'warning');
};

/**
 * 정보 메시지를 표시합니다.
 */
export const showInfoMessage = (message: string, title: string = '알림') => {
  showCustomAlert(title, message, [{ text: '확인' }], 'info');
};

/**
 * 확인/취소가 있는 메시지를 표시합니다.
 */
export const showConfirmMessage = (
  message: string,
  title: string = '확인',
  onConfirm: () => void,
  onCancel?: () => void
) => {
  const buttons = [
    { text: '취소', style: 'cancel' as const, onPress: onCancel },
    { text: '확인', onPress: onConfirm },
  ];

  showCustomAlert(title, message, buttons, 'warning');
};

/**
 * 사용자 정의 버튼이 있는 메시지를 표시합니다.
 */
export const showCustomMessage = (
  message: string,
  title: string = '알림',
  buttons: {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[],
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
) => {
  showCustomAlert(title, message, buttons, type);
};

/**
 * 구글 로그인 관련 에러 메시지를 표시합니다.
 */
export const showGoogleLoginError = (error: any) => {
  let message = '알 수 없는 오류가 발생했습니다.';

  if (error?.type === 'cancelled' || error?.code === 'cancelled') {
    return; // 사용자가 취소한 경우 메시지 표시하지 않음
  }

  if (error?.message) {
    message = error.message;
  } else if (error?.response?.data?.message) {
    message = error.response.data.message;
  }

  showErrorMessage(message, '구글 로그인 실패');
};

/**
 * 네트워크 에러 메시지를 표시합니다.
 */
export const showNetworkError = () => {
  showErrorMessage('네트워크 연결을 확인해주세요.', '네트워크 오류');
};

/**
 * 인증 에러 메시지를 표시합니다.
 */
export const showAuthError = (message: string = '로그인이 필요합니다.') => {
  showErrorMessage(message, '인증 오류');
};

/**
 * 베팅 관련 성공 메시지를 표시합니다.
 */
export const showBetSuccessMessage = (message: string) => {
  showSuccessMessage(message, '베팅 성공');
};

/**
 * 베팅 관련 에러 메시지를 표시합니다.
 */
export const showBetErrorMessage = (message: string) => {
  showErrorMessage(message, '베팅 오류');
};

/**
 * 베팅 확인 메시지를 표시합니다.
 */
export const showBetConfirmMessage = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  showConfirmMessage(message, '베팅 확인', onConfirm, onCancel);
};

/**
 * 포인트 관련 성공 메시지를 표시합니다.
 */
export const showPointSuccessMessage = (message: string) => {
  showSuccessMessage(message, '포인트');
};

/**
 * 포인트 관련 에러 메시지를 표시합니다.
 */
export const showPointErrorMessage = (message: string) => {
  showErrorMessage(message, '포인트 오류');
};

/**
 * 경마 관련 성공 메시지를 표시합니다.
 */
export const showRaceSuccessMessage = (message: string) => {
  showSuccessMessage(message, '경마');
};

/**
 * 경마 관련 에러 메시지를 표시합니다.
 */
export const showRaceErrorMessage = (message: string) => {
  showErrorMessage(message, '경마 오류');
};

/**
 * 사용자 관련 성공 메시지를 표시합니다.
 */
export const showUserSuccessMessage = (message: string) => {
  showSuccessMessage(message, '사용자');
};

/**
 * 사용자 관련 에러 메시지를 표시합니다.
 */
export const showUserErrorMessage = (message: string) => {
  showErrorMessage(message, '사용자 오류');
};

/**
 * 삭제 확인 메시지를 표시합니다.
 */
export const showDeleteConfirmMessage = (
  itemName: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  showCustomAlert(
    '삭제 확인',
    `${itemName}을(를) 정말 삭제하시겠습니까?`,
    [
      { text: '취소', style: 'cancel', onPress: onCancel },
      { text: '삭제', style: 'destructive', onPress: onConfirm },
    ],
    'warning'
  );
};

/**
 * 로그아웃 확인 메시지를 표시합니다.
 */
export const showLogoutConfirmMessage = (onConfirm: () => void, onCancel?: () => void) => {
  showCustomAlert(
    '로그아웃',
    '정말 로그아웃하시겠습니까?',
    [
      { text: '취소', style: 'cancel', onPress: onCancel },
      { text: '로그아웃', style: 'destructive', onPress: onConfirm },
    ],
    'warning'
  );
};
