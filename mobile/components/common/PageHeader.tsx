import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { GOLD_THEME } from '@/constants/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
    <View style={styles.container}>
      {/* 왼쪽: 백 버튼 또는 빈 공간 */}
      <View style={styles.leftContainer}>
        {showBackButton && onBackPress ? (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name='arrow-back' size={24} color={GOLD_THEME.GOLD.LIGHT} />
          </TouchableOpacity>
        ) : (
          leftComponent
        )}
      </View>

      {/* 중앙: 제목 */}
      <View style={styles.textContainer}>
        <ThemedText type='title' style={styles.title}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText type='subtitle' style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        )}
      </View>

      {/* 오른쪽: 커스텀 컴포넌트 또는 빈 공간 */}
      <View style={styles.rightContainer}>{rightComponent}</View>
    </View>
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
    justifyContent: 'space-between',
    paddingVertical: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
  },
  leftContainer: {
    width: 60,
    alignItems: 'flex-start',
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
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_THEME.GOLD.LIGHT,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
  },
});
