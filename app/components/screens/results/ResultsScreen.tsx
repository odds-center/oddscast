import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import { ThemedText as Text } from '@/components/ThemedText';
import { Title, Subtitle } from '@/components/ui';
import { PageHeader } from '@/components/common';

interface RaceResult {
  id: string;
  raceName: string;
  venue: string;
  date: string;
  winner: {
    horseName: string;
    jockey: string;
    gateNumber: number;
    odds: number;
  };
  results: {
    position: number;
    horseName: string;
    jockey: string;
    gateNumber: number;
    odds: number;
    time: string;
  }[];
}

const MOCK_RESULTS: RaceResult[] = [
  {
    id: '1',
    raceName: '제주 1경주',
    venue: '제주',
    date: '2025-07-06',
    winner: {
      horseName: '금빛질주',
      jockey: '김기수',
      gateNumber: 1,
      odds: 2.5,
    },
    results: [
      {
        position: 1,
        horseName: '금빛질주',
        jockey: '김기수',
        gateNumber: 1,
        odds: 2.5,
        time: '1:23.45',
      },
      {
        position: 2,
        horseName: '천리마',
        jockey: '박태종',
        gateNumber: 3,
        odds: 3.2,
        time: '1:23.67',
      },
      {
        position: 3,
        horseName: '바람의아들',
        jockey: '이성현',
        gateNumber: 2,
        odds: 4.1,
        time: '1:24.12',
      },
    ],
  },
  {
    id: '2',
    raceName: '서울 5경주',
    venue: '서울',
    date: '2025-07-06',
    winner: {
      horseName: '돌콩',
      jockey: '문세영',
      gateNumber: 1,
      odds: 1.8,
    },
    results: [
      {
        position: 1,
        horseName: '돌콩',
        jockey: '문세영',
        gateNumber: 1,
        odds: 1.8,
        time: '1:22.34',
      },
      {
        position: 2,
        horseName: '실버울프',
        jockey: '유현명',
        gateNumber: 3,
        odds: 5.2,
        time: '1:22.89',
      },
      {
        position: 3,
        horseName: '클린업조이',
        jockey: '함완식',
        gateNumber: 2,
        odds: 6.5,
        time: '1:23.45',
      },
    ],
  },
];

export default function ResultsScreen() {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const venues = ['all', '서울', '부산', '제주', '광주'];
  const { colors, spacing, radii, fonts, shadows } = useAppTheme();

  const filteredResults =
    selectedVenue === 'all'
      ? MOCK_RESULTS
      : MOCK_RESULTS.filter((result) => result.venue === selectedVenue);

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return colors.primary;
      case 2:
        return colors.textSecondary;
      case 3:
        return colors.accent;
      default:
        return colors.textTertiary;
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return 'trophy';
      case 2:
        return 'medal';
      case 3:
        return 'ribbon';
      default:
        return 'ellipse';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.m,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontFamily: fonts.heading,
      fontSize: 28,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
    },
    shareButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.small,
    },
    filterContainer: {
      paddingHorizontal: spacing.l,
      marginBottom: spacing.m,
    },
    filterScroll: {
      paddingRight: spacing.l,
    },
    filterButton: {
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
      borderRadius: radii.round,
      backgroundColor: colors.card,
      marginRight: spacing.s,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: colors.text,
    },
    summaryContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.l,
      marginBottom: spacing.l,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      marginRight: spacing.s,
      flexDirection: 'row',
      alignItems: 'center',
      ...shadows.small,
    },
    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    summaryNumber: {
      fontFamily: fonts.bold,
      fontSize: 20,
      color: colors.text,
    },
    summaryLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textSecondary,
    },
    resultsContainer: {
      flex: 1,
    },
    resultsContent: {
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.xl,
    },
    resultCard: {
      marginBottom: spacing.m,
    },
    cardContent: {
      borderRadius: radii.l,
      padding: spacing.m,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.medium,
    },
    raceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.m,
    },
    raceInfo: {
      flex: 1,
    },
    raceName: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    raceDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    venueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    venue: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    date: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    statusBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.xs,
      borderRadius: radii.s,
    },
    statusText: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.text,
    },
    winnerContainer: {
      backgroundColor: colors.cardSecondary,
      borderRadius: radii.m,
      padding: spacing.m,
      marginBottom: spacing.m,
      flexDirection: 'row',
      alignItems: 'center',
    },
    winnerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.xs,
      borderRadius: radii.s,
      marginRight: spacing.m,
    },
    winnerText: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.primary,
      marginLeft: spacing.xs,
    },
    winnerInfo: {
      flex: 1,
    },
    winnerHorseName: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    winnerDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    winnerJockey: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
    },
    winnerGate: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.s,
    },
    winnerOdds: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.s,
    },
    resultsTable: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: spacing.m,
    },
    tableHeader: {
      flexDirection: 'row',
      marginBottom: spacing.s,
      paddingBottom: spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerText: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight + '50',
    },
    positionContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    positionText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      marginLeft: spacing.xs,
    },
    horseName: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.text,
      flex: 2,
      textAlign: 'center',
    },
    jockey: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
      textAlign: 'center',
    },
    time: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    odds: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.accent,
      flex: 1,
      textAlign: 'center',
    },
  });

  return (
    <LinearGradient
      colors={colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <PageHeader
        title="경주 결과"
        subtitle="최근 경마 결과를 확인하세요"
        showNotificationButton={true}
        onNotificationPress={() => console.log('Share button pressed')}
        notificationIconName="share-outline"
      />

      {/* Venue Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue}
              style={[styles.filterButton, selectedVenue === venue && styles.filterButtonActive]}
              onPress={() => setSelectedVenue(venue)}
            >
              <Text style={[styles.filterText, selectedVenue === venue && styles.filterTextActive]}>
                {venue === 'all' ? '전체' : venue}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name='trophy' size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.summaryNumber}>{filteredResults.length}</Text>
            <Text style={styles.summaryLabel}>완료된 경주</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name='trending-up' size={24} color={colors.success} />
          </View>
          <View>
            <Text style={styles.summaryNumber}>
              {Math.round(
                (filteredResults.reduce((sum, result) => sum + result.winner.odds, 0) /
                  filteredResults.length) *
                  10
              ) / 10}
            </Text>
            <Text style={styles.summaryLabel}>평균 배당률</Text>
          </View>
        </View>
      </View>

      {/* Results List */}
      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContent}
      >
        {filteredResults.map((result) => (
          <View key={result.id} style={styles.resultCard}>
            <LinearGradient
              colors={colors.gradient.card as [string, string]}
              style={styles.cardContent}
            >
              {/* Race Header */}
              <View style={styles.raceHeader}>
                <View style={styles.raceInfo}>
                  <Text style={styles.raceName}>{result.raceName}</Text>
                  <View style={styles.raceDetails}>
                    <View style={styles.venueContainer}>
                      <Ionicons name='location' size={14} color={colors.primary} />
                      <Text style={styles.venue}>{result.venue}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Ionicons name='calendar' size={14} color={colors.accent} />
                      <Text style={styles.date}>{result.date}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>완료</Text>
                </View>
              </View>

              {/* Winner Highlight */}
              <View style={styles.winnerContainer}>
                <View style={styles.winnerBadge}>
                  <Ionicons name='trophy' size={20} color={colors.primary} />
                  <Text style={styles.winnerText}>우승</Text>
                </View>
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerHorseName}>{result.winner.horseName}</Text>
                  <View style={styles.winnerDetails}>
                    <Text style={styles.winnerJockey}>{result.winner.jockey}</Text>
                    <Text style={styles.winnerGate}>• {result.winner.gateNumber}번</Text>
                    <Text style={styles.winnerOdds}>• {result.winner.odds}배</Text>
                  </View>
                </View>
              </View>

              {/* Results Table */}
              <View style={styles.resultsTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerText}>순위</Text>
                  <Text style={styles.headerText}>말 이름</Text>
                  <Text style={styles.headerText}>기수</Text>
                  <Text style={styles.headerText}>시간</Text>
                  <Text style={styles.headerText}>배당</Text>
                </View>
                {result.results.map((item) => (
                  <View key={item.position} style={styles.tableRow}>
                    <View style={styles.positionContainer}>
                      <Ionicons
                        name={getPositionIcon(item.position) as any}
                        size={16}
                        color={getPositionColor(item.position)}
                      />
                      <Text
                        style={[styles.positionText, { color: getPositionColor(item.position) }]}
                      >
                        {item.position}
                      </Text>
                    </View>
                    <Text style={styles.horseName}>{item.horseName}</Text>
                    <Text style={styles.jockey}>{item.jockey}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                    <Text style={styles.odds}>{item.odds}배</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}
