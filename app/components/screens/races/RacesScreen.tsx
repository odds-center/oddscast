import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import RaceCard from './RaceCard';
import { supabase } from '@/lib/supabase';
import { Race } from '@/constants/mockData';

export default function RacesScreen() {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const venues = ['all', '서울', '부산', '제주', '광주'];

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        let query = supabase.from('races').select('*');

        if (selectedVenue !== 'all') {
          query = query.eq('venue', selectedVenue);
        }

        const { data, error } = await query.order('date', { ascending: true });

        if (error) {
          throw error;
        }

        setRaces(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, [selectedVenue]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing.m }}>경주 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name='alert-circle-outline' size={64} color={theme.colors.error} />
        <Text style={{ marginTop: theme.spacing.m, color: theme.colors.error }}>
          오류가 발생했습니다: {error}
        </Text>
      </View>
    );
  }

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
            <Text type='title' style={{ color: theme.colors.text }}>
              경주 일정
            </Text>
            <Text type='subtitle' style={{ color: theme.colors.text }}>
              오늘의 경마 일정을 확인하세요
            </Text>
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
              <Text
                type='defaultSemiBold'
                style={[styles.filterText, selectedVenue === venue && styles.filterTextActive]}
              >
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
            <Text type='stat'>{races.length}</Text>
            <Text type='caption'>오늘 경주</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='trophy' size={20} color={theme.colors.accent} />
          </View>
          <View>
            <Text type='stat'>12</Text>
            <Text type='caption'>총 말 수</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='trending-up' size={20} color={theme.colors.success} />
          </View>
          <View>
            <Text type='stat'>85%</Text>
            <Text type='caption'>예측률</Text>
          </View>
        </View>
      </View>

      {/* Races List */}
      <ScrollView
        style={styles.racesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.racesContent}
      >
        {races.length > 0 ? (
          races.map((race) => <RaceCard key={race.id} race={race} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name='calendar-outline' size={64} color={theme.colors.textTertiary} />
            <Text type='defaultSemiBold' style={styles.emptyText}>
              선택한 지역의 경주가 없습니다
            </Text>
            <Text type='subtitle' style={styles.emptySubtext}>
              다른 지역을 선택해보세요
            </Text>
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
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginRight: theme.spacing.s,
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
    marginTop: theme.spacing.m,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: theme.spacing.s,
    textAlign: 'center',
  },
});
