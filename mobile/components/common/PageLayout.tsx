import { GOLD_THEME } from '@/constants/theme';
import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

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
  const scrollViewProps = scrollable
    ? {
        showsVerticalScrollIndicator,
        removeClippedSubviews: true, // 성능 최적화
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : {};

  return (
    <View style={[styles.container, style]}>
      <ContentWrapper style={[styles.content, contentStyle]} {...scrollViewProps}>
        {children}
      </ContentWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100, // 하단 탭바 높이만큼 여백 추가
  },
});
