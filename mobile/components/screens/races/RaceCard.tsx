import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import type { Race } from '@/lib/types/race';

interface RaceCardProps {
  race: Race;
  onPress?: () => void;
}

export function RaceCard({ race, onPress }: RaceCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM 형식으로 변환
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return '#2196F3';
      case 'IN_PROGRESS':
        return '#FF9800';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return '예정';
      case 'IN_PROGRESS':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
        return '취소';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <ThemedView style={styles.card}>
        <View style={styles.header}>
          <View style={styles.raceInfo}>
            <ThemedText type='defaultSemiBold' style={styles.raceName}>
              {race.rcName}
            </ThemedText>
            <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
              제{race.rcNo}경주
            </ThemedText>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(race.raceStatus || 'UPCOMING') },
              ]}
            >
              <ThemedText type='small' style={styles.statusText}>
                {getStatusText(race.raceStatus || 'UPCOMING')}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
              경주장:
            </ThemedText>
            <ThemedText type='caption'>{race.meetName}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
              거리:
            </ThemedText>
            <ThemedText type='caption'>{race.rcDist}m</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
              등급:
            </ThemedText>
            <ThemedText type='caption'>{race.rcGrade}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
              시간:
            </ThemedText>
            <ThemedText type='caption'>
              {race.rcStartTime ? formatTime(race.rcStartTime) : '미정'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText type='defaultSemiBold' lightColor='#B48A3C' darkColor='#E5C99C'>
            상금: {race.rcPrize?.toLocaleString()}원
          </ThemedText>
          <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
            출마마: {race.totalEntries || 0}마
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    marginBottom: 4,
  },
  statusContainer: {
    marginLeft: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(180, 138, 60, 0.2)',
  },
});
