import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Race } from '@/constants/mockData';
import { theme } from '@/constants/theme';

const RaceCard = ({ race }: { race: Race }) => (
  <LinearGradient colors={theme.gradients.card} style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.raceName}>{race.raceName}</Text>
      <Text style={styles.raceInfo}>{race.venue} | {race.date}</Text>
    </View>
    {race.horses.map(horse => (
      <View key={horse.id} style={styles.horseRow}>
        <View style={styles.horseInfo}>
          <Text style={styles.gateNumber}>{horse.gateNumber}</Text>
          <Text style={styles.horseName}>{horse.horseName}</Text>
        </View>
        <View style={styles.jockeyTrainer}>
          <View style={styles.iconText}>
            <Ionicons name="ios-person" size={14} color={theme.colors.subtleText} />
            <Text style={styles.jockey}>{horse.jockey}</Text>
          </View>
          <View style={styles.iconText}>
            <Ionicons name="ios-briefcase" size={14} color={theme.colors.subtleText} />
            <Text style={styles.trainer}>{horse.trainer}</Text>
          </View>
        </View>
        <View style={styles.predictionContainer}>
          <View style={[styles.predictionBar, { width: `${horse.predictionRate}%` }]} />
          <Text style={styles.predictionText}>{horse.predictionRate}%</Text>
        </View>
      </View>
    ))}
  </LinearGradient>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    marginBottom: theme.spacing.m,
  },
  raceName: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.primary,
  },
  raceInfo: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.subtleText,
  },
  horseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  horseInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gateNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.primary,
    marginRight: theme.spacing.m,
  },
  horseName: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
  },
  jockeyTrainer: {
    flex: 2,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s / 2,
  },
  jockey: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.subtleText,
    marginLeft: theme.spacing.s,
  },
  trainer: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.subtleText,
    marginLeft: theme.spacing.s,
  },
  predictionContainer: {
    flex: 1,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radii.m,
    height: 20,
    justifyContent: 'center',
  },
  predictionBar: {
    backgroundColor: theme.colors.primary,
    height: '100%',
    borderRadius: theme.radii.m,
  },
  predictionText: {
    position: 'absolute',
    right: theme.spacing.s,
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.text,
  },
});

export default RaceCard;
