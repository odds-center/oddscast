import { Alert, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * 크로스 플랫폼 Alert/Toast 유틸리티
 *
 * - 일반 메시지: Toast 사용 (빠른 피드백)
 * - 확인 다이얼로그: Alert 사용 (사용자 결정 필요)
 */

/**
 * 성공 메시지 표시 (Toast)
 */
export const showSuccessMessage = (message: string, title: string = '✅ 성공') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 60,
  });
};

/**
 * 에러 메시지 표시 (Toast)
 */
export const showErrorMessage = (message: string, title: string = '❌ 오류') => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    topOffset: 60,
  });
};

/**
 * 경고 메시지 표시 (Toast)
 */
export const showWarningMessage = (message: string, title: string = '⚠️ 주의') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 60,
  });
};

/**
 * 정보 메시지 표시 (Toast)
 */
export const showInfoMessage = (message: string, title: string = 'ℹ️ 알림') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 60,
  });
};

/**
 * 확인 다이얼로그 (Alert - 사용자 확인 필요)
 */
export const showConfirmMessage = (
  message: string,
  title: string = '확인',
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  showConfirmDialog(message, onConfirm, onCancel, title);
};

export const showConfirmDialog = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  title: string = '확인'
): void => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n${message}`);
    if (confirmed) {
      onConfirm();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(
      title,
      message,
      [
        {
          text: '취소',
          onPress: onCancel,
          style: 'cancel',
        },
        {
          text: '확인',
          onPress: onConfirm,
          style: 'default',
        },
      ],
      { cancelable: false }
    );
  }
};

/**
 * 삭제 확인 다이얼로그
 */
export const showDeleteConfirmMessage = (
  itemName: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${itemName}을(를) 정말 삭제하시겠습니까?`);
    if (confirmed) {
      onConfirm();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(
      '삭제 확인',
      `${itemName}을(를) 정말 삭제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: onConfirm,
        },
      ],
      { cancelable: false }
    );
  }
};

/**
 * 로그아웃 확인 다이얼로그
 */
export const showLogoutConfirmMessage = (onConfirm: () => void, onCancel?: () => void) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('정말 로그아웃하시겠습니까?');
    if (confirmed) {
      onConfirm();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: onConfirm,
        },
      ],
      { cancelable: false }
    );
  }
};

/**
 * 구글 로그인 에러 표시
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
 * 네트워크 에러 표시
 */
export const showNetworkError = () => {
  showErrorMessage('네트워크 연결을 확인해주세요.', '네트워크 오류');
};

/**
 * 인증 에러 표시
 */
export const showAuthError = (message: string = '로그인이 필요합니다.') => {
  showErrorMessage(message, '인증 오류');
};

/**
 * 베팅 성공 메시지
 */
export const showBetSuccessMessage = (message: string) => {
  showSuccessMessage(message, '🎯 베팅 완료');
};

/**
 * 베팅 에러 메시지
 */
export const showBetErrorMessage = (message: string) => {
  showErrorMessage(message, '베팅 오류');
};

/**
 * 베팅 확인 다이얼로그
 */
export const showBetConfirmMessage = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  showConfirmDialog(message, onConfirm, onCancel, '베팅 확인');
};

/**
 * 포인트 성공 메시지
 */
export const showPointSuccessMessage = (message: string) => {
  showSuccessMessage(message, '💰 포인트');
};

/**
 * 포인트 에러 메시지
 */
export const showPointErrorMessage = (message: string) => {
  showErrorMessage(message, '포인트 오류');
};

/**
 * 경주 성공 메시지
 */
export const showRaceSuccessMessage = (message: string) => {
  showSuccessMessage(message, '🏇 경주');
};

/**
 * 경주 에러 메시지
 */
export const showRaceErrorMessage = (message: string) => {
  showErrorMessage(message, '경주 오류');
};

/**
 * 사용자 성공 메시지
 */
export const showUserSuccessMessage = (message: string) => {
  showSuccessMessage(message, '👤 사용자');
};

/**
 * 사용자 에러 메시지
 */
export const showUserErrorMessage = (message: string) => {
  showErrorMessage(message, '사용자 오류');
};
