import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Race } from '@/constants/mockData';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';

interface RaceCardProps {
  race: Race;
  onPress?: () => void;
}

const RaceCard = ({ race, onPress }: RaceCardProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={theme.colors.gradient.card as [string, string]} style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.raceInfo}>
            <View style={styles.raceNumberContainer}>
              <Text style={styles.raceNumber}>{race.raceNumber}</Text>
            </View>
            <View style={styles.raceDetails}>
              <Text style={styles.raceName}>{race.raceName}</Text>
              <View style={styles.venueTimeContainer}>
                <View style={styles.venueContainer}>
                  <Ionicons name='location' size={14} color={theme.colors.primary} />
                  <Text style={styles.venue}>{race.venue}</Text>
                </View>
                <View style={styles.timeContainer}>
                  <Ionicons name='time' size={14} color={theme.colors.accent} />
                  <Text style={styles.time}>{race.date.split(' ')[1]}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>진행중</Text>
            </View>
          </View>
        </View>

        {/* Horses List */}
        <View style={styles.horsesContainer}>
          {race.horses.map((horse, index) => (
            <View key={horse.id} style={styles.horseRow}>
              <View style={styles.horseInfo}>
                <View style={styles.gateNumberContainer}>
                  <Text style={styles.gateNumber}>{horse.gateNumber}</Text>
                </View>
                <View style={styles.horseDetails}>
                  <Text style={styles.horseName}>{horse.horseName}</Text>
                  <View style={styles.jockeyTrainerContainer}>
                    <View style={styles.jockeyContainer}>
                      <Ionicons name='person' size={12} color={theme.colors.textSecondary} />
                      <Text style={styles.jockey}>{horse.jockey}</Text>
                    </View>
                    <View style={styles.trainerContainer}>
                      <Ionicons name='briefcase' size={12} color={theme.colors.textSecondary} />
                      <Text style={styles.trainer}>{horse.trainer}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.predictionContainer}>
                <View style={styles.predictionBarContainer}>
                  <View
                    style={[
                      styles.predictionBar,
                      { width: `${Math.min(horse.predictionRate, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.predictionText}>{horse.predictionRate}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerStats}>
            <View style={styles.statItem}>
              <Ionicons name='people' size={16} color={theme.colors.textSecondary} />
              <Text style={styles.statText}>{race.horses.length}마 출전</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name='trending-up' size={16} color={theme.colors.textSecondary} />
              <Text style={styles.statText}>
                평균{' '}
                {Math.round(
                  race.horses.reduce((sum, h) => sum + h.predictionRate, 0) / race.horses.length
                )}
                %
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => router.push(`/races/${race.id}` as any)}
          >
            <Text style={styles.detailButtonText}>상세보기</Text>
            <Ionicons name='chevron-forward' size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
  },
  card: {
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.m,
  },
  raceInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  raceNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  raceNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  raceDetails: {
    flex: 1,
  },
  raceName: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  venueTimeContainer: {
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  statusContainer: {
    alignItems: 'flex-end',
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
  horsesContainer: {
    marginBottom: theme.spacing.m,
  },
  horseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  horseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gateNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  gateNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
  },
  horseDetails: {
    flex: 1,
  },
  horseName: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  jockeyTrainerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jockeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  jockey: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  trainerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainer: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  predictionContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  predictionBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },
  predictionBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  predictionText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  footerStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  statText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.radii.m,
    backgroundColor: theme.colors.cardSecondary,
  },
  detailButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
});

export default RaceCard;
