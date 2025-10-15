import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';
import { Button } from './Button';

interface ErrorStateProps {
  error?: string | Error;
  title?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

/**
 * 에러 상태 표시 컴포넌트
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = '오류가 발생했습니다',
  onRetry,
  style,
}) => {
  const errorMessage =
    typeof error === 'string' ? error : error?.message || '알 수 없는 오류가 발생했습니다';

  return (
    <View style={[styles.container, style]}>
      <Ionicons name='alert-circle' size={64} color={GOLD_THEME.STATUS.ERROR} />
      <ThemedText type='subtitle' style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type='body' style={styles.message}>
        {errorMessage}
      </ThemedText>
      {onRetry && (
        <Button
          title='다시 시도'
          onPress={onRetry}
          variant='outline'
          size='medium'
          icon='refresh'
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 24,
    marginBottom: 12,
    color: GOLD_THEME.STATUS.ERROR,
    textAlign: 'center',
  },
  message: {
    color: GOLD_THEME.TEXT.TERTIARY,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
  },
});

