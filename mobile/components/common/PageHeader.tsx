import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  showSafeArea?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  leftComponent,
  rightComponent,
  showSafeArea = true,
  showBackButton = false,
  onBackPress,
}) => {
  const headerContent = (
    <ThemedView style={styles.container}>
      {showBackButton && onBackPress && (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Ionicons name='arrow-back' size={24} color={GOLD_THEME.GOLD.LIGHT} />
        </TouchableOpacity>
      )}
      <ThemedView style={styles.textContainer}>
        <ThemedText type='title' style={styles.title}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText type='subtitle' style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        )}
      </ThemedView>
      {rightComponent && <ThemedView style={styles.rightContainer}>{rightComponent}</ThemedView>}
    </ThemedView>
  );

  if (showSafeArea) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {headerContent}
      </SafeAreaView>
    );
  }

  return headerContent;
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_THEME.GOLD.LIGHT,
    lineHeight: 28,
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 22,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
});
