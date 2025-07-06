
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '@/constants/theme';

export default function ResultsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Race Results</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Past race results will be displayed here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    color: theme.colors.primary,
    marginBottom: theme.spacing.l,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.l,
    width: '100%',
    alignItems: 'center',
  },
  cardText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
});

