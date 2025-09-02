import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
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
          <Ionicons name='arrow-back' size={24} color='transparent' />
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
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
});
