import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { RACES } from '@/constants/mockData';
import { useAppTheme } from '@/constants/theme';
import { Title } from '@/components/ui';
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
    statusThemedText: {
      fontFamily: fonts.bold,
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
      color: colors.text,
      marginBottom: spacing.xs,
    },
    horseMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    horseMetaThemedText: {
      fontFamily: fonts.body,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    horseStats: {
      alignItems: 'flex-end',
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
    actionButtonThemedText: {
      fontFamily: fonts.bold,
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
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      alignSelf: 'flex-start',
    },
    backButtonThemedText: {
      fontFamily: fonts.bold,
      color: colors.primary,
      marginLeft: spacing.xs,
    },
    trackConditionSection: {
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    conditionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.s,
      backgroundColor: 'rgba(255, 215, 0, 0.05)',
      borderRadius: radii.s,
      gap: spacing.xs,
    },
    conditionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    conditionThemedText: {
      color: colors.text,
      fontFamily: fonts.body,
    },
    conditionDivider: {
      color: colors.textSecondary,
      marginHorizontal: spacing.xs,
    },
    aiAnalysisSection: {
      backgroundColor: 'rgba(255, 215, 0, 0.08)',
      borderRadius: radii.m,
      padding: spacing.m,
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    confidenceBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.xs,
      borderRadius: radii.s,
      alignSelf: 'flex-start',
      marginBottom: spacing.m,
    },
    confidenceThemedText: {
      fontFamily: fonts.bold,
      color: colors.background,
    },
    topPickSection: {
      marginBottom: spacing.m,
    },
    topPickLabel: {
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    topPickValue: {
      color: colors.primary,
    },
    aiRecommendation: {
      color: colors.text,
      lineHeight: 20,
      marginBottom: spacing.m,
    },
    factorsList: {
      marginTop: spacing.m,
    },
    factorsTitle: {
      color: colors.text,
      marginBottom: spacing.m,
    },
    factorItem: {
      backgroundColor: 'rgba(255, 215, 0, 0.08)',
      padding: spacing.m,
      borderRadius: radii.m,
      marginBottom: spacing.s,
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.15)',
    },
    factorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    factorName: {
      color: colors.text,
      flex: 1,
    },
    impactBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.xs,
      borderRadius: radii.s,
      minWidth: 60,
      alignItems: 'center',
    },
    impactThemedText: {
      fontFamily: fonts.bold,
      color: colors.background,
    },
    factorDescription: {
      color: colors.textSecondary,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    horseDetailCard: {
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.l,
      marginBottom: spacing.m,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    horseCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    gateNumberBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    gateNumberThemedText: {
      fontFamily: fonts.bold,
      color: colors.background,
    },
    horseMainInfo: {
      flex: 1,
    },
    horseAge: {
      color: colors.textSecondary,
      marginTop: 2,
    },
    aiScoreBadge: {
      alignItems: 'center',
      padding: spacing.s,
      backgroundColor: colors.primary,
      borderRadius: radii.s,
      minWidth: 50,
    },
    aiScoreThemedText: {
      fontFamily: fonts.bold,
      color: colors.background,
    },
    aiScoreLabel: {
      fontFamily: fonts.bold,
      color: colors.background,
      marginTop: 2,
    },
    horseStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing.s,
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.s,
      backgroundColor: 'rgba(255, 215, 0, 0.05)',
      borderRadius: radii.s,
    },
    horseStat: {
      alignItems: 'center',
      flex: 1,
    },
    horseStatLabel: {
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    horseStatValue: {
      color: colors.text,
    },
    bettingStatsSection: {
      marginTop: spacing.xs,
      marginBottom: spacing.s,
      padding: spacing.s,
      backgroundColor: 'rgba(255, 215, 0, 0.06)',
      borderRadius: radii.s,
    },
    bettingStatsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.m,
      gap: spacing.xs,
    },
    bettingStatsTitle: {
      color: colors.text,
      fontFamily: fonts.bold,
    },
    bettingStatsContent: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    bettingStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    bettingStatLabel: {
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    bettingStatValue: {
      color: colors.primary,
    },
    jockeyTrainerRow: {
      flexDirection: 'row',
      marginBottom: spacing.m,
      justifyContent: 'space-around',
    },
    jockeyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    jockeyThemedText: {
      fontFamily: fonts.body,
      color: colors.text,
    },
    trainerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    trainerThemedText: {
      fontFamily: fonts.body,
      color: colors.text,
    },
    recentRecordsSection: {
      marginTop: spacing.s,
      paddingTop: spacing.m,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    recentRecordsTitle: {
      color: colors.textSecondary,
      marginBottom: spacing.s,
      fontFamily: fonts.bold,
    },
    recordItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    recordRank: {
      fontFamily: fonts.bold,
      color: colors.text,
      width: 40,
    },
    recordDetails: {
      fontFamily: fonts.body,
      color: colors.textSecondary,
      flex: 1,
    },
  });

  if (!race) {
    return (
      <View style={styles.centered}>
        <Title>경주 정보를 찾을 수 없습니다</Title>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={20} color={colors.primary} />
          <ThemedText style={styles.backButtonThemedText}>뒤로가기</ThemedText>
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
            <ThemedText type='caption' style={styles.statusThemedText}>
              {race.grade}
            </ThemedText>
          </View>
        }
      />

      {/* 주요 정보 카드 */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Ionicons name='calendar' size={20} color={colors.primary} />
          <ThemedText type='stat'>{race.raceNumber}경주</ThemedText>
          <ThemedText type='caption' style={{ marginTop: 4 }}>
            경주번호
          </ThemedText>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name='resize' size={20} color={colors.accent} />
          <ThemedText type='stat'>{race.distance}m</ThemedText>
          <ThemedText type='caption' style={{ marginTop: 4 }}>
            거리
          </ThemedText>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name='trophy' size={20} color={colors.primary} />
          <ThemedText type='stat'>{(race.prize / 10000).toLocaleString()}만</ThemedText>
          <ThemedText type='caption' style={{ marginTop: 4 }}>
            상금
          </ThemedText>
        </View>
      </View>

      {/* 트랙 컨디션 */}
      <View style={[styles.section, styles.trackConditionSection]}>
        <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>
          트랙 컨디션
        </ThemedText>
        <View style={styles.conditionRow}>
          <View style={styles.conditionItem}>
            <Ionicons
              name={
                race.trackCondition.weather === 'sunny'
                  ? 'sunny'
                  : race.trackCondition.weather === 'cloudy'
                  ? 'cloudy'
                  : race.trackCondition.weather === 'rainy'
                  ? 'rainy'
                  : 'cloud'
              }
              size={16}
              color={colors.primary}
            />
            <ThemedText type='caption' style={styles.conditionThemedText}>
              {race.trackCondition.weather === 'sunny'
                ? '맑음'
                : race.trackCondition.weather === 'cloudy'
                ? '흐림'
                : race.trackCondition.weather === 'rainy'
                ? '비'
                : '안개'}
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.conditionDivider}>
            •
          </ThemedText>
          <View style={styles.conditionItem}>
            <Ionicons name='thermometer' size={16} color={colors.primary} />
            <ThemedText type='caption' style={styles.conditionThemedText}>
              {race.trackCondition.temperature}°C
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.conditionDivider}>
            •
          </ThemedText>
          <View style={styles.conditionItem}>
            <Ionicons name='water' size={16} color={colors.primary} />
            <ThemedText type='caption' style={styles.conditionThemedText}>
              습도 {race.trackCondition.humidity}%
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.conditionDivider}>
            •
          </ThemedText>
          <View style={styles.conditionItem}>
            <Ionicons name='speedometer' size={16} color={colors.primary} />
            <ThemedText type='caption' style={styles.conditionThemedText}>
              {race.trackCondition.surface === 'fast'
                ? '빠름'
                : race.trackCondition.surface === 'good'
                ? '양호'
                : race.trackCondition.surface === 'soft'
                ? '습함'
                : '무거움'}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* AI 분석 */}
      <View style={[styles.section, styles.aiAnalysisSection]}>
        <View style={styles.aiHeader}>
          <Ionicons name='analytics' size={24} color={colors.primary} />
          <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>
            AI 예측 분석
          </ThemedText>
        </View>
        <View style={styles.confidenceBadge}>
          <ThemedText type='caption' style={styles.confidenceThemedText}>
            신뢰도 {race.aiAnalysis.confidence}%
          </ThemedText>
        </View>
        <View style={styles.topPickSection}>
          <ThemedText type='caption' style={styles.topPickLabel}>
            AI 추천 1순위
          </ThemedText>
          <ThemedText type='title' style={styles.topPickValue}>
            {race.horses.find((h) => h.id === race.aiAnalysis.topPick)?.horseName}
          </ThemedText>
        </View>
        <ThemedText type='caption' style={styles.aiRecommendation}>
          {race.aiAnalysis.recommendation}
        </ThemedText>
        <View style={styles.factorsList}>
          <ThemedText type='defaultSemiBold' style={styles.factorsTitle}>
            주요 예측 요인
          </ThemedText>
          {race.aiAnalysis.factors.map((factor, idx) => (
            <View key={idx} style={styles.factorItem}>
              <View style={styles.factorHeader}>
                <ThemedText type='defaultSemiBold' style={styles.factorName}>
                  {factor.name}
                </ThemedText>
                <View style={styles.impactBadge}>
                  <ThemedText type='caption' style={styles.impactThemedText}>
                    {factor.impact}/10
                  </ThemedText>
                </View>
              </View>
              <ThemedText type='caption' style={styles.factorDescription}>
                {factor.description}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* 출전마 상세 정보 */}
      <View style={styles.section}>
        <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>
          출전마 상세 정보
        </ThemedText>
        {race.horses
          .sort((a, b) => b.aiScore - a.aiScore)
          .map((horse, idx) => (
            <View key={horse.id} style={styles.horseDetailCard}>
              <View style={styles.horseCardHeader}>
                <View style={styles.gateNumberBadge}>
                  <ThemedText type='stat' style={styles.gateNumberThemedText}>
                    {horse.gateNumber}
                  </ThemedText>
                </View>
                <View style={styles.horseMainInfo}>
                  <ThemedText type='subtitle' style={styles.horseName}>
                    {horse.horseName}
                  </ThemedText>
                  <ThemedText type='caption' style={styles.horseAge}>
                    {horse.age}세 • {horse.weight}kg
                  </ThemedText>
                </View>
                <View style={styles.aiScoreBadge}>
                  <ThemedText type='stat' style={styles.aiScoreThemedText}>
                    {horse.aiScore}
                  </ThemedText>
                  <ThemedText type='caption' style={styles.aiScoreLabel}>
                    AI
                  </ThemedText>
                </View>
              </View>

              <View style={styles.horseStatsRow}>
                <View style={styles.horseStat}>
                  <ThemedText type='caption' style={styles.horseStatLabel}>
                    최근 폼
                  </ThemedText>
                  <ThemedText type='defaultSemiBold' style={styles.horseStatValue}>
                    {horse.form}
                  </ThemedText>
                </View>
                <View style={styles.horseStat}>
                  <ThemedText type='caption' style={styles.horseStatLabel}>
                    승률
                  </ThemedText>
                  <ThemedText type='defaultSemiBold' style={styles.horseStatValue}>
                    {horse.winRate.toFixed(1)}%
                  </ThemedText>
                </View>
                <View style={styles.horseStat}>
                  <ThemedText type='caption' style={styles.horseStatLabel}>
                    평균 속도
                  </ThemedText>
                  <ThemedText type='defaultSemiBold' style={styles.horseStatValue}>
                    {horse.avgSpeed}m/s
                  </ThemedText>
                </View>
                <View style={styles.horseStat}>
                  <ThemedText type='caption' style={styles.horseStatLabel}>
                    인기순위
                  </ThemedText>
                  <ThemedText type='defaultSemiBold' style={styles.horseStatValue}>
                    {horse.bettingStats.popularityRank}위
                  </ThemedText>
                </View>
              </View>

              {/* 마권 구매 통계 */}
              <View style={styles.bettingStatsSection}>
                <View style={styles.bettingStatsHeader}>
                  <Ionicons name='people' size={16} color={colors.primary} />
                  <ThemedText type='caption' style={styles.bettingStatsTitle}>
                    실시간 마권 구매 현황
                  </ThemedText>
                </View>
                <View style={styles.bettingStatsContent}>
                  <View style={styles.bettingStatItem}>
                    <ThemedText type='caption' style={styles.bettingStatLabel}>
                      총 구매
                    </ThemedText>
                    <ThemedText type='defaultSemiBold' style={styles.bettingStatValue}>
                      {horse.bettingStats.totalBets.toLocaleString()}건
                    </ThemedText>
                  </View>
                  <View style={styles.bettingStatItem}>
                    <ThemedText type='caption' style={styles.bettingStatLabel}>
                      구매 금액
                    </ThemedText>
                    <ThemedText type='defaultSemiBold' style={styles.bettingStatValue}>
                      {(horse.bettingStats.totalAmount / 10000).toLocaleString()}만원
                    </ThemedText>
                  </View>
                  <View style={styles.bettingStatItem}>
                    <ThemedText type='caption' style={styles.bettingStatLabel}>
                      전체 비율
                    </ThemedText>
                    <ThemedText type='defaultSemiBold' style={styles.bettingStatValue}>
                      {(
                        (horse.bettingStats.totalBets /
                          race.horses.reduce((sum, h) => sum + h.bettingStats.totalBets, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.jockeyTrainerRow}>
                <View style={styles.jockeyInfo}>
                  <Ionicons name='person' size={14} color={colors.textSecondary} />
                  <ThemedText type='caption' style={styles.jockeyThemedText}>
                    {horse.jockey}
                  </ThemedText>
                </View>
                <View style={styles.trainerInfo}>
                  <Ionicons name='briefcase' size={14} color={colors.textSecondary} />
                  <ThemedText type='caption' style={styles.trainerThemedText}>
                    {horse.trainer}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.recentRecordsSection}>
                <ThemedText type='caption' style={styles.recentRecordsTitle}>
                  최근 3경주 기록
                </ThemedText>
                {horse.recentRecords.map((record, recordIdx) => (
                  <View key={recordIdx} style={styles.recordItem}>
                    <ThemedText type='caption' style={styles.recordRank}>
                      {record.rank === 1
                        ? '🥇'
                        : record.rank === 2
                        ? '🥈'
                        : record.rank === 3
                        ? '🥉'
                        : `${record.rank}위`}
                    </ThemedText>
                    <ThemedText type='caption' style={styles.recordDetails}>
                      {record.date.slice(5)} • {record.venue} • {record.totalHorses}마 •{' '}
                      {record.time}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ))}
      </View>

      {/* 하단 액션 */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={18} color={colors.text} />
          <ThemedText type='defaultSemiBold' style={styles.actionButtonThemedText}>
            뒤로가기
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name='star-outline' size={18} color={colors.primary} />
          <ThemedText type='defaultSemiBold' style={styles.actionButtonThemedText}>
            즐겨찾기
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name='share-social-outline' size={18} color={colors.primary} />
          <ThemedText type='defaultSemiBold' style={styles.actionButtonThemedText}>
            공유
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
