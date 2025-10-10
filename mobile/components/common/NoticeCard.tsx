import { ThemedText } from '@/components/ThemedText';
import { GOLD_THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface NoticeCardProps {
  title: string;
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: any;
}

/**
 * 알림/공지 카드 컴포넌트
 */
export function NoticeCard({ title, text, icon = 'information-circle', style }: NoticeCardProps) {
  return (
    <View style={[styles.noticeCard, style]}>
      <View style={styles.noticeHeader}>
        <Ionicons name={icon} size={20} color={GOLD_THEME.TEXT.SECONDARY} />
        <ThemedText type='title' style={styles.noticeTitle}>
          {title}
        </ThemedText>
      </View>
      <ThemedText style={styles.noticeText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
  noticeText: {
    fontSize: 14,
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
});
