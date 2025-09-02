import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { Race } from '@/lib/types/race';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

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
        return '#DAA520'; // 골든로드
      case 'IN_PROGRESS':
        return '#FFD700'; // 진한 골드
      case 'COMPLETED':
        return '#B8860B'; // 다크골든로드
      case 'CANCELLED':
        return '#CD853F'; // 페루
      default:
        return '#CD853F'; // 페루
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
        <ThemedView style={styles.header}>
          <ThemedView style={styles.raceInfo}>
            <ThemedText style={styles.raceName}>{race.rcName}</ThemedText>
            <ThemedText style={styles.raceNumber}>제{race.rcNo}경주</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statusContainer}>
            <ThemedView
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(race.raceStatus || 'UPCOMING') },
              ]}
            >
              <ThemedText type='small' style={styles.statusText}>
                {getStatusText(race.raceStatus || 'UPCOMING')}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.details}>
          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>경주장:</ThemedText>
            <ThemedText style={styles.detailValue}>{race.meetName}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>거리:</ThemedText>
            <ThemedText style={styles.detailValue}>{race.rcDist}m</ThemedText>
          </ThemedView>

          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>등급:</ThemedText>
            <ThemedText style={styles.detailValue}>{race.rcGrade}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>시간:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {race.rcStartTime ? formatTime(race.rcStartTime) : '미정'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.prizeText}>상금: {race.rcPrize?.toLocaleString()}원</ThemedText>
          <ThemedText style={styles.entriesText}>출마마: {race.totalEntries || 0}마</ThemedText>
        </ThemedView>
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
  // 누락된 스타일들 추가
  raceNumber: {
    fontSize: 14,
    color: '#FFD700',
    opacity: 0.8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9BA1A6',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  prizeText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  entriesText: {
    fontSize: 14,
    color: '#9BA1A6',
  },
});
