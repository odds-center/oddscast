import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useResults } from '@/lib/hooks/useResults';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { RaceResult } from '@/lib/api/resultApi';

export default function ResultsScreen() {
  const [selectedRaceId, setSelectedRaceId] = useState<string>('race-1');

  const { data: results, isLoading, error } = useResults(selectedRaceId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#007AFF' />
        <ThemedText style={styles.loadingText}>결과를 불러오는 중...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>결과를 불러오는데 실패했습니다.</ThemedText>
        <TouchableOpacity style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>다시 시도</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>레이스 결과</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {results && results.length > 0 ? (
          results.map((result: RaceResult) => (
            <ThemedView key={result.id} style={styles.resultCard}>
              <View style={styles.positionContainer}>
                <ThemedText style={styles.position}>{result.rcRank}</ThemedText>
              </View>
              <View style={styles.horseInfo}>
                <ThemedText style={styles.horseName}>{result.hrName}</ThemedText>
                <ThemedText style={styles.jockeyName}>기수: {result.jkName}</ThemedText>
              </View>
              <View style={styles.resultDetails}>
                <ThemedText style={styles.finishTime}>{result.rcTime}</ThemedText>
                <ThemedText style={styles.odds}>
                  상금: {result.rcPrize?.toLocaleString() || 0}원
                </ThemedText>
              </View>
            </ThemedView>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>결과가 없습니다.</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  positionContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  position: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  horseInfo: {
    flex: 1,
  },
  horseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  jockeyName: {
    fontSize: 14,
    color: '#666',
  },
  resultDetails: {
    alignItems: 'flex-end',
  },
  finishTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  odds: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
