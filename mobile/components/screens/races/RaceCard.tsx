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
            <ThemedText style={styles.raceName}>{race.rcName}</ThemedText>
            <ThemedText style={styles.raceNumber}>제{race.rcNo}경주</ThemedText>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(race.raceStatus || 'UPCOMING') },
              ]}
            >
              <ThemedText style={styles.statusText}>
                {getStatusText(race.raceStatus || 'UPCOMING')}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>경주장:</ThemedText>
            <ThemedText style={styles.detailValue}>{race.meetName}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>거리:</ThemedText>
            <ThemedText style={styles.detailValue}>{race.rcDist}m</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>등급:</ThemedText>
            <ThemedText style={styles.detailValue}>{race.rcGrade}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>시간:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {race.rcStartTime ? formatTime(race.rcStartTime) : '미정'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.prizeText}>상금: {race.rcPrize?.toLocaleString()}원</ThemedText>
          <ThemedText style={styles.entriesText}>출마마: {race.totalEntries || 0}마</ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  raceNumber: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
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
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  prizeText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  entriesText: {
    fontSize: 14,
    color: '#666',
  },
});
