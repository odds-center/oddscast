import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RACES } from '@/constants/mockData';
import { theme } from '@/constants/theme';
import RaceCard from './RaceCard';

export default function RacesScreen() {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const venues = ['all', '서울', '부산', '제주', '광주'];

  const filteredRaces =
    selectedVenue === 'all' ? RACES : RACES.filter((race) => race.venue === selectedVenue);

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
            <Text style={styles.title}>경주 일정</Text>
            <Text style={styles.subtitle}>오늘의 경마 일정을 확인하세요</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name='notifications-outline' size={24} color={theme.colors.primary} />
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

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='calendar' size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.statNumber}>{filteredRaces.length}</Text>
            <Text style={styles.statLabel}>오늘 경주</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='trophy' size={20} color={theme.colors.accent} />
          </View>
          <View>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>총 말 수</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='trending-up' size={20} color={theme.colors.success} />
          </View>
          <View>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>예측률</Text>
          </View>
        </View>
      </View>

      {/* Races List */}
      <ScrollView
        style={styles.racesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.racesContent}
      >
        {filteredRaces.length > 0 ? (
          filteredRaces.map((race) => <RaceCard key={race.id} race={race} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name='calendar-outline' size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>선택한 지역의 경주가 없습니다</Text>
            <Text style={styles.emptySubtext}>다른 지역을 선택해보세요</Text>
          </View>
        )}
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
  notificationButton: {
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginRight: theme.spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.s,
  },
  statNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.text,
  },
  statLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  racesContainer: {
    flex: 1,
  },
  racesContent: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.text,
    marginTop: theme.spacing.m,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.s,
    textAlign: 'center',
  },
});
