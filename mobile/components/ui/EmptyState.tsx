import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

/**
 * 데이터가 없을 때 표시하는 EmptyState 컴포넌트
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-text-outline',
  title,
  message,
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={GOLD_THEME.TEXT.TERTIARY} />
      <ThemedText type='subtitle' style={styles.title}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText type='body' style={styles.message}>
          {message}
        </ThemedText>
      )}
      {actionText && onActionPress && (
        <Button
          title={actionText}
          onPress={onActionPress}
          variant='outline'
          size='medium'
          style={styles.actionButton}
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
    color: GOLD_THEME.TEXT.PRIMARY,
    textAlign: 'center',
  },
  message: {
    color: GOLD_THEME.TEXT.TERTIARY,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    marginTop: 16,
  },
});
