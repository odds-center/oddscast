import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  showHeader?: boolean;
  showSafeArea?: boolean;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  leftComponent,
  rightComponent,
  showHeader = true,
  showSafeArea = true,
  scrollable = true,
  refreshing = false,
  onRefresh,
  contentStyle,
  headerStyle,
}) => {
  const headerContent =
    showHeader && (title || leftComponent || rightComponent) ? (
      <ThemedView style={[styles.header, headerStyle]}>
        <View style={styles.leftSection}>{leftComponent}</View>

        <View style={styles.centerSection}>
          {title && (
            <ThemedText
              type='largeTitle'
              lightColor='#B48A3C'
              darkColor='#E5C99C'
              style={styles.title}
            >
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText
              type='subtitle'
              lightColor='#687076'
              darkColor='#9BA1A6'
              style={styles.subtitle}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>

        <View style={styles.rightSection}>{rightComponent}</View>
      </ThemedView>
    ) : null;

  const content = scrollable ? (
    <ScrollView
      style={[styles.scrollView, contentStyle]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#E5C99C'
            colors={['#E5C99C']}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  const pageContent = (
    <ThemedView variant='background' style={styles.container}>
      {headerContent}
      {content}
    </ThemedView>
  );

  if (showSafeArea) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {pageContent}
      </SafeAreaView>
    );
  }

  return pageContent;
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 80,
  },
  leftSection: {
    width: 60,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 60,
    alignItems: 'flex-end',
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});
