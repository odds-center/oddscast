import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import RaceCard from './RaceCard';
import { supabase } from '@/lib/supabase';
import { Race } from '@/constants/mockData';
import { Subtitle } from '@/components/ui';
import { PageHeader } from '@/components/common';

export default function RacesScreen() {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const venues = ['all', '서울', '부산', '제주', '광주'];
  const { colors, spacing, radii, shadows, fonts } = useAppTheme();

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
    notificationButton: {
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
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: colors.text,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.l,
      marginBottom: spacing.l,
    },
    statCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      marginRight: spacing.s,
      ...shadows.small,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.s,
    },
    racesContainer: {
      flex: 1,
    },
    racesContent: {
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.xl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyText: {
      marginTop: spacing.m,
      textAlign: 'center',
    },
    emptySubtext: {
      marginTop: spacing.s,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={{ marginTop: spacing.m }}>경주 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name='alert-circle-outline' size={64} color={colors.error} />
        <Text style={{ marginTop: spacing.m, color: colors.error }}>
          오류가 발생했습니다: {error}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <PageHeader
        title="경주 일정"
        subtitle="오늘의 경마 일정을 확인하세요"
        showNotificationButton={true}
        onNotificationPress={() => console.log('Notification button pressed')}
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
            <Ionicons name='calendar' size={20} color={colors.primary} />
          </View>
          <View>
            <Text type='stat'>{races.length}</Text>
            <Text type='caption'>오늘 경주</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='trophy' size={20} color={colors.accent} />
          </View>
          <View>
            <Text type='stat'>12</Text>
            <Text type='caption'>총 말 수</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name='trending-up' size={20} color={colors.success} />
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
            <Ionicons name='calendar-outline' size={64} color={colors.textTertiary} />
            <Text type='defaultSemiBold' style={styles.emptyText}>
              선택한 지역의 경주가 없습니다
            </Text>
            <Subtitle style={styles.emptySubtext}>다른 지역을 선택해보세요</Subtitle>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

