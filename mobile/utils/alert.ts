import { Alert, Platform } from 'react-native';

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
 * 성공 메시지를 표시합니다.
 */
export const showSuccessMessage = (message: string, title: string = '성공') => {
  if (Platform.OS === 'android') {
    Alert.alert(title, message, [{ text: '확인' }], getAlertStyle());
  } else {
    Alert.alert(title, message, [{ text: '확인' }]);
  }
};

/**
 * 에러 메시지를 표시합니다.
 */
export const showErrorMessage = (message: string, title: string = '오류') => {
  if (Platform.OS === 'android') {
    Alert.alert(title, message, [{ text: '확인' }], getAlertStyle());
  } else {
    Alert.alert(title, message, [{ text: '확인' }]);
  }
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

  if (Platform.OS === 'android') {
    Alert.alert(title, message, buttons, getAlertStyle());
  } else {
    Alert.alert(title, message, buttons);
  }
};

/**
 * 사용자 정의 버튼이 있는 메시지를 표시합니다.
 */
export const showCustomMessage = (
  message: string,
  title: string = '알림',
  buttons: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>
) => {
  if (Platform.OS === 'android') {
    Alert.alert(title, message, buttons, getAlertStyle());
  } else {
    Alert.alert(title, message, buttons);
  }
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
 * 포인트 관련 성공 메시지를 표시합니다.
 */
export const showPointSuccessMessage = (message: string) => {
  showSuccessMessage(message, '포인트 성공');
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
  showSuccessMessage(message, '경마 성공');
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
  showSuccessMessage(message, '사용자 성공');
};

/**
 * 사용자 관련 에러 메시지를 표시합니다.
 */
export const showUserErrorMessage = (message: string) => {
  showErrorMessage(message, '사용자 오류');
};
