import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

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
  results: Array<{
    position: number;
    horseName: string;
    jockey: string;
    gateNumber: number;
    odds: number;
    time: string;
  }>;
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

  const filteredResults =
    selectedVenue === 'all'
      ? MOCK_RESULTS
      : MOCK_RESULTS.filter((result) => result.venue === selectedVenue);

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return theme.colors.primary;
      case 2:
        return theme.colors.textSecondary;
      case 3:
        return theme.colors.accent;
      default:
        return theme.colors.textTertiary;
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

  return (
    <LinearGradient
      colors={theme.colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>경주 결과</Text>
            <Text style={styles.subtitle}>최근 경마 결과를 확인하세요</Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name='share-outline' size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

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
            <Ionicons name='trophy' size={24} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.summaryNumber}>{filteredResults.length}</Text>
            <Text style={styles.summaryLabel}>완료된 경주</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name='trending-up' size={24} color={theme.colors.success} />
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
              colors={theme.colors.gradient.card as [string, string]}
              style={styles.cardContent}
            >
              {/* Race Header */}
              <View style={styles.raceHeader}>
                <View style={styles.raceInfo}>
                  <Text style={styles.raceName}>{result.raceName}</Text>
                  <View style={styles.raceDetails}>
                    <View style={styles.venueContainer}>
                      <Ionicons name='location' size={14} color={theme.colors.primary} />
                      <Text style={styles.venue}>{result.venue}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Ionicons name='calendar' size={14} color={theme.colors.accent} />
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
                  <Ionicons name='trophy' size={20} color={theme.colors.primary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  filterScroll: {
    paddingRight: theme.spacing.l,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.card,
    marginRight: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.text,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginRight: theme.spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  summaryNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.text,
  },
  summaryLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
  },
  resultCard: {
    marginBottom: theme.spacing.m,
  },
  cardContent: {
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.m,
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  raceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  venue: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  statusBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.s,
  },
  statusText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.text,
  },
  winnerContainer: {
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.s,
    marginRight: theme.spacing.m,
  },
  winnerText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerHorseName: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  winnerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerJockey: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  winnerGate: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.s,
  },
  winnerOdds: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.s,
  },
  resultsTable: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: theme.spacing.m,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.s,
    paddingBottom: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight + '50',
  },
  positionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    marginLeft: theme.spacing.xs,
  },
  horseName: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
    flex: 2,
    textAlign: 'center',
  },
  jockey: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  time: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  odds: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.accent,
    flex: 1,
    textAlign: 'center',
  },
});
