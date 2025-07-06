
import React from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import { RACES } from '@/constants/mockData';
import RaceCard from './RaceCard';
import { theme } from '@/constants/theme';

export default function RacesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Races</Text>
      <FlatList
        data={RACES}
        renderItem={({ item }) => <RaceCard race={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    color: theme.colors.primary,
    marginBottom: theme.spacing.l,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: theme.spacing.l,
  },
});

