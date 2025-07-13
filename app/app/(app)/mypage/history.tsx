import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import { PageHeader } from '@/components/common';
import { useRouter } from 'expo-router';

const mockHistory = [
  { id: '1', date: '2025-07-01', race: '서울 5경주', odds: 2.5, result: '적중' },
  { id: '2', date: '2025-06-28', race: '제주 1경주', odds: 4.1, result: '미적중' },
  { id: '3', date: '2025-06-20', race: '부산 3경주', odds: 3.2, result: '적중' },
];

export default function BettingHistoryScreen() {
  const router = useRouter();
  const { colors, spacing, radii, fonts } = useAppTheme();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: spacing.l },
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      marginBottom: spacing.s,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemLeft: {},
    race: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
    date: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemRight: { alignItems: 'flex-end' },
    odds: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.primary,
    },
    result: {
      fontFamily: fonts.bold,
      fontSize: 14,
      marginTop: 2,
    },
    hit: { color: colors.success },
    miss: { color: colors.error },
    empty: {
      textAlign: 'center',
      color: colors.textTertiary,
      marginTop: 40,
      fontFamily: fonts.body,
    },
  });

  return (
    <View style={styles.container}>
      <PageHeader
        title="베팅 내역"
        subtitle="나의 베팅 기록"
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      <FlatList
        data={mockHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.race}>{item.race}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.odds}>{item.odds}배</Text>
              <Text style={[styles.result, item.result === '적중' ? styles.hit : styles.miss]}>
                {item.result}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>베팅 내역이 없습니다.</Text>}
      />
    </View>
  );
}
