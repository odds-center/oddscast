import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { RACES } from '@/constants/mockData';
import { useAppTheme } from '@/constants/theme';
import { Title, Subtitle } from '@/components/ui';
import { PageHeader } from '@/components/common/PageHeader';

export default function RaceDetailScreen() {
  const { raceId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, spacing, radii, fonts } = useAppTheme();
  const race = RACES.find((r) => String(r.id) === String(raceId));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: spacing.l,
      paddingBottom: spacing.xl,
    },
    statusBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.xs,
      borderRadius: radii.s,
      marginTop: spacing.s,
    },
    statusText: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.text,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.l,
    },
    infoCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      alignItems: 'center',
      marginHorizontal: spacing.xs,
    },
    section: {
      marginBottom: spacing.l,
    },
    sectionTitle: {
      fontSize: 18,
      marginBottom: spacing.m,
    },
    horseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    horseInfo: {
      flex: 1,
    },
    horseName: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    horseMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    horseMetaText: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    horseStats: {
      alignItems: 'flex-end',
    },
    horseStat: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.primary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.l,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardSecondary,
      paddingHorizontal: spacing.l,
      paddingVertical: spacing.s,
      borderRadius: radii.m,
    },
    actionButtonText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.text,
      marginLeft: spacing.xs,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.l,
    },
    backButtonText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.primary,
      marginLeft: spacing.xs,
    },
  });

  if (!race) {
    return (
      <View style={styles.centered}>
        <Title>경주 정보를 찾을 수 없습니다</Title>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <PageHeader
        title={race.raceName}
        subtitle={`${race.venue} | ${race.date}`}
        showBackButton={true}
        onBackPress={() => router.back()}
        rightComponent={
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>진행중</Text>
          </View>
        }
      />
      {/* 주요 정보 카드 */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Ionicons name='calendar' size={20} color={colors.primary} />
          <Text type='stat'>{race.raceNumber}경주</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name='people' size={20} color={colors.accent} />
          <Text type='stat'>{race.horses.length}마</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name='trending-up' size={20} color={colors.success} />
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
                <Ionicons name='person' size={14} color={colors.textSecondary} />
                <Text style={styles.horseMetaText}>{horse.jockey}</Text>
                <Ionicons
                  name='briefcase'
                  size={14}
                  color={colors.textSecondary}
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
          <Ionicons name='arrow-back' size={18} color={colors.text} />
          <Text style={styles.actionButtonText}>뒤로가기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name='star-outline' size={18} color={colors.primary} />
          <Text style={styles.actionButtonText}>즐겨찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name='share-social-outline' size={18} color={colors.primary} />
          <Text style={styles.actionButtonText}>공유</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
