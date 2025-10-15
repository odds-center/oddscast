import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { GOLD_THEME } from '@/constants/theme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

/**
 * 로딩 상태 표시 컴포넌트
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = '로딩 중...',
  size = 'large',
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <ActivityIndicator size={size} color={GOLD_THEME.GOLD.LIGHT} />
        {message && (
          <ThemedText type='body' style={styles.message}>
            {message}
          </ThemedText>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={GOLD_THEME.GOLD.LIGHT} />
      {message && (
        <ThemedText type='body' style={styles.message}>
          {message}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
  },
  container: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    color: GOLD_THEME.TEXT.SECONDARY,
    textAlign: 'center',
  },
});
