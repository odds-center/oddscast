import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

interface PageLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  scrollable?: boolean;
  showsVerticalScrollIndicator?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  style,
  contentStyle,
  scrollable = true,
  showsVerticalScrollIndicator = false,
}) => {
  const ContentWrapper = scrollable ? ScrollView : View;
  const scrollViewProps = scrollable ? { showsVerticalScrollIndicator } : {};

  return (
    <ThemedView style={[styles.container, style]}>
      <ContentWrapper style={[styles.content, contentStyle]} {...scrollViewProps}>
        {children}
      </ContentWrapper>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    paddingTop: 60, // 상단 여백 조정 (노치 영역 포함)
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100, // 하단 탭바 높이만큼 여백 추가
  },
});
