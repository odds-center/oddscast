import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout, Section, Button } from '@/components/common';
import { useRaces } from '@/lib/hooks/useRaces';
import { RaceCard } from './RaceCard';

export default function RacesScreen() {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const venues = ['all', '서울', '부산', '제주', '광주'];

  // TanStack Query 훅 사용
  const {
    data: racesResponse,
    isLoading,
    error,
  } = useRaces({
    page: 1,
    limit: 50,
  });

  const races = racesResponse?.races || [];

  // 선택된 지역에 따라 필터링
  const filteredRaces =
    selectedVenue === 'all' ? races : races.filter((race) => race.meetName === selectedVenue);

  if (isLoading) {
    return (
      <PageLayout showHeader={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#E5C99C' />
          <ThemedText type='body' style={styles.loadingText}>
            레이스 정보를 불러오는 중...
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
            레이스 정보를 불러오는데 실패했습니다.
          </ThemedText>
          <Button title='다시 시도' onPress={() => {}} variant='primary' size='medium' />
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout title='경주 일정' subtitle='오늘의 경주 정보를 확인하세요'>
      {/* 지역 필터 */}
      <Section variant='outlined'>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue}
              style={[styles.filterButton, selectedVenue === venue && styles.filterButtonActive]}
              onPress={() => setSelectedVenue(venue)}
            >
              <ThemedText
                type='defaultSemiBold'
                style={[
                  styles.filterButtonText,
                  selectedVenue === venue && styles.filterButtonTextActive,
                ]}
              >
                {venue === 'all' ? '전체' : venue}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Section>

      {/* 경주 목록 */}
      {filteredRaces.length > 0 ? (
        <Section variant='elevated'>
          {filteredRaces.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              onPress={() => {
                // 경주 상세 페이지로 이동
                console.log('Race selected:', race.id);
              }}
            />
          ))}
        </Section>
      ) : (
        <Section variant='elevated'>
          <View style={styles.emptyContainer}>
            <ThemedText type='body' style={styles.emptyText}>
              {selectedVenue === 'all'
                ? '등록된 경주가 없습니다.'
                : `${selectedVenue}에 등록된 경주가 없습니다.`}
            </ThemedText>
          </View>
        </Section>
      )}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  filterScrollContent: {
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: 'rgba(180, 138, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
  },
  filterButtonActive: {
    backgroundColor: '#B48A3C',
  },
  filterButtonText: {
    color: '#B48A3C',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
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
