import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { RACES } from '@/constants/mockData';
import { theme } from '@/constants/theme';

export default function RaceDetailScreen() {
  const { raceId } = useLocalSearchParams();
  const router = useRouter();
  const race = RACES.find((r) => String(r.id) === String(raceId));

  if (!race) {
    return (
      <View style={styles.centered}>
        <Text type='title'>경주 정보를 찾을 수 없습니다</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={20} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 상단 경주 정보 */}
      <View style={styles.header}>
        <Text type='title'>{race.raceName}</Text>
        <Text type='subtitle'>
          {race.venue} | {race.date}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>진행중</Text>
        </View>
      </View>
      {/* 주요 정보 카드 */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Ionicons name='calendar' size={20} color={theme.colors.primary} />
          <Text type='stat'>{race.raceNumber}경주</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name='people' size={20} color={theme.colors.accent} />
          <Text type='stat'>{race.horses.length}마</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name='trending-up' size={20} color={theme.colors.success} />
          <Text type='stat'>
            평균{' '}
            {Math.round(
              race.horses.reduce((sum, h) => sum + h.predictionRate, 0) / race.horses.length
            )}
            %
          </Text>
        </View>
      </View>
      {/* 말/기수/트레이너 리스트 */}
      <View style={styles.section}>
        <Text type='defaultSemiBold' style={styles.sectionTitle}>
          출전마 정보
        </Text>
        {race.horses.map((horse, idx) => (
          <View key={horse.id} style={styles.horseRow}>
            <View style={styles.horseInfo}>
              <Text style={styles.horseName}>{horse.horseName}</Text>
              <View style={styles.horseMeta}>
                <Ionicons name='person' size={14} color={theme.colors.textSecondary} />
                <Text style={styles.horseMetaText}>{horse.jockey}</Text>
                <Ionicons
                  name='briefcase'
                  size={14}
                  color={theme.colors.textSecondary}
                  style={{ marginLeft: 8 }}
                />
                <Text style={styles.horseMetaText}>{horse.trainer}</Text>
              </View>
            </View>
            <View style={styles.horseStats}>
              <Text style={styles.horseStat}>{horse.predictionRate}%</Text>
            </View>
          </View>
        ))}
      </View>
      {/* 하단 액션 */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={18} color={theme.colors.text} />
          <Text style={styles.actionButtonText}>뒤로가기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name='star-outline' size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>즐겨찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name='share-social-outline' size={18} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>공유</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  statusBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.s,
    marginTop: theme.spacing.s,
  },
  statusText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.l,
  },
  infoCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: theme.spacing.m,
  },
  horseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  horseInfo: {
    flex: 1,
  },
  horseName: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  horseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horseMetaText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  horseStats: {
    alignItems: 'flex-end',
  },
  horseStat: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.l,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardSecondary,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.radii.m,
  },
  actionButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.l,
  },
  backButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
});
