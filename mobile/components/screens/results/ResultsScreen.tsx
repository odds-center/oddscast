import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useResults } from '@/lib/hooks/useResults';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout, Section, Button } from '@/components/common';
import type { RaceResult } from '@/lib/api/resultApi';

export default function ResultsScreen() {
  const [selectedRaceId, setSelectedRaceId] = useState<string>('race-1');

  const { data: results, isLoading, error } = useResults(selectedRaceId);

  if (isLoading) {
    return (
      <PageLayout showHeader={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#E5C99C' />
          <ThemedText type='body' style={styles.loadingText}>
            결과를 불러오는 중...
          </ThemedText>
        </View>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout showHeader={false}>
        <View style={styles.errorContainer}>
          <ThemedText type='body' style={styles.errorText}>
            결과를 불러오는데 실패했습니다.
          </ThemedText>
          <Button title='다시 시도' onPress={() => {}} variant='primary' size='medium' />
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout title='레이스 결과' subtitle='오늘의 경주 결과를 확인하세요'>
      {/* 결과 목록 */}
      {results && results.length > 0 ? (
        <Section variant='elevated'>
          {results.map((result: RaceResult) => (
            <View key={result.id} style={styles.resultCard}>
              <View style={styles.positionContainer}>
                <ThemedText type='largeTitle' style={styles.position}>
                  {result.rcRank}
                </ThemedText>
              </View>
              <View style={styles.horseInfo}>
                <ThemedText type='defaultSemiBold' style={styles.horseName}>
                  {result.hrName}
                </ThemedText>
                <ThemedText type='caption' lightColor='#687076' darkColor='#9BA1A6'>
                  기수: {result.jkName}
                </ThemedText>
              </View>
              <View style={styles.resultDetails}>
                <ThemedText type='caption' style={styles.finishTime}>
                  {result.rcTime}
                </ThemedText>
                <ThemedText type='defaultSemiBold' lightColor='#B48A3C' darkColor='#E5C99C'>
                  상금: {result.rcPrize?.toLocaleString() || 0}원
                </ThemedText>
              </View>
            </View>
          ))}
        </Section>
      ) : (
        <Section variant='elevated'>
          <View style={styles.emptyContainer}>
            <ThemedText type='body' style={styles.emptyText}>
              결과가 없습니다.
            </ThemedText>
          </View>
        </Section>
      )}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
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
});
