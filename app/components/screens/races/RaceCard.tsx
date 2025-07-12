import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Race } from '@/constants/mockData';
import { useAppTheme } from '@/constants/theme';
import { useRouter } from 'expo-router';

interface RaceCardProps {
  race: Race;
  onPress?: () => void;
}

const RaceCard = ({ race, onPress }: RaceCardProps) => {
  const router = useRouter();
  const { colors, spacing, radii, shadows, fonts } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.m,
    },
    card: {
      borderRadius: radii.l,
      padding: spacing.m,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.medium,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.m,
    },
    raceInfo: {
      flexDirection: 'row',
      flex: 1,
    },
    raceNumberContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    raceNumber: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
    raceDetails: {
      flex: 1,
    },
    raceName: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    venueTimeContainer: {
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
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    time: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    statusContainer: {
      alignItems: 'flex-end',
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
    horsesContainer: {
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
      flexDirection: 'row',
      alignItems: 'center',
    },
    gateNumberContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    gateNumber: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.text,
    },
    horseDetails: {
      flex: 1,
    },
    horseName: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    jockeyTrainerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    jockeyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    jockey: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    trainerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trainer: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    predictionContainer: {
      width: 80,
      alignItems: 'flex-end',
    },
    predictionBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    predictionBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    predictionText: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.text,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.m,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    footerStats: {
      flexDirection: 'row',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    statText: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    detailButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
      borderRadius: radii.m,
      backgroundColor: colors.cardSecondary,
    },
    detailButtonText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.primary,
      marginRight: spacing.xs,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={colors.gradient.card as [string, string]} style={styles.card}>
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
                  <Ionicons name='location' size={14} color={colors.primary} />
                  <Text style={styles.venue}>{race.venue}</Text>
                </View>
                <View style={styles.timeContainer}>
                  <Ionicons name='time' size={14} color={colors.accent} />
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
                      <Ionicons name='person' size={12} color={colors.textSecondary} />
                      <Text style={styles.jockey}>{horse.jockey}</Text>
                    </View>
                    <View style={styles.trainerContainer}>
                      <Ionicons name='briefcase' size={12} color={colors.textSecondary} />
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
              <Ionicons name='people' size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>{race.horses.length}마 출전</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name='trending-up' size={16} color={colors.textSecondary} />
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
            <Ionicons name='chevron-forward' size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default RaceCard;
