import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useResults } from '@/lib/hooks/useResults';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PageLayout, Section, Button } from '@/components/common';
import type { RaceResult } from '@/lib/api/resultApi';

export default function ResultsScreen() {
  const [selectedRaceId, setSelectedRaceId] = useState<string>('race-1');

  const { data: results, isLoading, error } = useResults(selectedRaceId);

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#E5C99C' />
        <ThemedText style={styles.loadingText}>결과를 불러오는 중...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>결과를 불러오는데 실패했습니다.</ThemedText>
        <TouchableOpacity style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>다시 시도</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {results && results.length > 0 ? (
          results.map((result: RaceResult) => (
            <ThemedView key={result.id} style={styles.resultCard}>
              <ThemedView style={styles.positionContainer}>
                <ThemedText type='stat' style={styles.position}>
                  {result.rcRank}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.horseInfo}>
                <ThemedText type='subtitle' style={styles.horseName}>
                  {result.hrName}
                </ThemedText>
                <ThemedText type='caption' style={styles.jockeyName}>
                  기수: {result.jkName}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.resultDetails}>
                <ThemedText type='default' style={styles.finishTime}>
                  {result.rcTime}
                </ThemedText>
                <ThemedText type='caption' style={styles.odds}>
                  상금: {result.rcPrize?.toLocaleString() || 0}원
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ))
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText type='subtitle' style={styles.emptyText}>
              결과가 없습니다.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    marginBottom: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  positionContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B48A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#B48A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  position: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  horseInfo: {
    flex: 1,
    marginRight: 16,
  },
  horseName: {
    marginBottom: 4,
    opacity: 0.9,
  },
  resultDetails: {
    alignItems: 'flex-end',
  },
  finishTime: {
    marginBottom: 4,
    opacity: 0.8,
  },
  jockeyName: {
    opacity: 0.7,
  },
  odds: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#B48A3C',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
