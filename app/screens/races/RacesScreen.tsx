
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { RACES, Race } from '@/constants/mockData';

const RaceCard = ({ race }: { race: Race }) => (
  <View style={styles.raceCard}>
    <ThemedText type="title">{race.raceName}</ThemedText>
    <ThemedText>{race.venue} | {race.date}</ThemedText>
  </View>
);

export default function RacesScreen() {
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={RACES}
        renderItem={({ item }) => <RaceCard race={item} />}
        keyExtractor={item => item.id}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  raceCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
});
