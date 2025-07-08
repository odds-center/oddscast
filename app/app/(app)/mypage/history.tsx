import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';

const mockHistory = [
  { id: '1', date: '2025-07-01', race: '서울 5경주', odds: 2.5, result: '적중' },
  { id: '2', date: '2025-06-28', race: '제주 1경주', odds: 4.1, result: '미적중' },
  { id: '3', date: '2025-06-20', race: '부산 3경주', odds: 3.2, result: '적중' },
];

export default function BettingHistoryScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='chevron-back' size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>베팅 내역</Text>
        <View style={{ width: 28 }} />
      </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'center',
  },
  listContent: { padding: theme.spacing.l },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemLeft: {},
  race: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  date: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemRight: { alignItems: 'flex-end' },
  odds: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  result: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    marginTop: 2,
  },
  hit: { color: theme.colors.success },
  miss: { color: theme.colors.error },
  empty: {
    textAlign: 'center',
    color: theme.colors.textTertiary,
    marginTop: 40,
    fontFamily: theme.fonts.body,
  },
});
