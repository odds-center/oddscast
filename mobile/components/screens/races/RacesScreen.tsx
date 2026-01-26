import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 디자인 시스템
import { StyledText, Card, Badge, Section, EmptyState } from '@/components/ui';
import { PageLayout } from '@/components/common';
import { Colors, Spacing, BorderRadius } from '@/constants/designTokens';
import { RACES } from '@/constants/mockData';

export default function RacesScreen() {
  const router = useRouter();
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const venues = ['all', '서울', '부산', '제주', '광주'];

  // Mock 데이터 사용
  const mockRaces = RACES;

  // 선택된 지역에 따라 필터링
  const filteredRaces =
    selectedVenue === 'all' ? mockRaces : mockRaces.filter((race) => race.venue === selectedVenue);

  const handleRacePress = (raceId: string) => {
    router.push(`/race-detail/${raceId}`);
  };

  const getTrackConditionIcon = (weather: string) => {
    switch (weather) {
      case 'sunny':
        return 'sunny';
      case 'cloudy':
        return 'cloudy';
      case 'rainy':
        return 'rainy';
      default:
        return 'cloud';
    }
  };

  const getSurfaceLabel = (surface: string) => {
    switch (surface) {
      case 'fast':
        return '빠름';
      case 'good':
        return '양호';
      case 'soft':
        return '습함';
      default:
        return '무거움';
    }
  };

  return (
    <PageLayout>
      {/* 지역 필터 */}
      <View style={styles.filterSection}>
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
              <StyledText
                variant='button'
                style={[
                  styles.filterButtonText,
                  selectedVenue === venue && styles.filterButtonTextActive,
                ]}
              >
                {venue === 'all' ? '전체' : venue}
              </StyledText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 경주 목록 */}
      <Section>
        {filteredRaces.length > 0 ? (
          filteredRaces.map((race) => (
            <Card
              key={race.id}
              variant='base'
              onPress={() => handleRacePress(race.id)}
              style={styles.raceCard}
            >
              <View style={styles.raceHeader}>
                <View style={styles.raceInfo}>
                  <StyledText variant='h3' style={styles.raceName}>
                    {race.raceName}
                  </StyledText>
                  <StyledText variant='caption' color={Colors.text.tertiary}>
                    {race.venue} • {race.raceNumber}경주 • {race.distance}m
                  </StyledText>
                </View>
                <Badge label={race.grade} variant='warning' />
              </View>

              {/* 트랙 컨디션 */}
              <View style={styles.trackConditionRow}>
                <View style={styles.conditionItem}>
                  <Ionicons
                    name={getTrackConditionIcon(race.trackCondition.weather) as any}
                    size={16}
                    color={Colors.text.secondary}
                  />
                  <StyledText variant='caption'>{race.trackCondition.temperature}°C</StyledText>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name='water' size={16} color={Colors.text.secondary} />
                  <StyledText variant='caption'>습도 {race.trackCondition.humidity}%</StyledText>
                </View>
                <View style={styles.conditionItem}>
                  <Ionicons name='speedometer' size={16} color={Colors.text.secondary} />
                  <StyledText variant='caption'>
                    {getSurfaceLabel(race.trackCondition.surface)}
                  </StyledText>
                </View>
              </View>

              {/* AI 예측 */}
              <View style={styles.aiAnalysisSection}>
                <View style={styles.aiHeader}>
                  <Ionicons name='analytics' size={18} color={Colors.primary.main} />
                  <StyledText
                    variant='bodySmall'
                    color={Colors.primary.main}
                    style={{ flex: 1, fontWeight: '600' }}
                  >
                    AI 예측
                  </StyledText>
                  <Badge label={`신뢰도 ${race.aiAnalysis.confidence}%`} variant='success' />
                </View>
                <StyledText variant='caption' style={styles.aiRecommendation}>
                  {race.aiAnalysis.recommendation}
                </StyledText>
              </View>

              <View style={styles.raceFooter}>
                <View style={styles.raceTime}>
                  <Ionicons name='time' size={16} color={Colors.text.tertiary} />
                  <StyledText
                    variant='caption'
                    color={Colors.text.tertiary}
                    style={styles.timeText}
                  >
                    {race.date.split(' ')[1] || ''}
                  </StyledText>
                </View>
                <View style={styles.prizeInfo}>
                  <Ionicons name='trophy' size={16} color={Colors.primary.main} />
                  <StyledText
                    variant='caption'
                    color={Colors.primary.main}
                    style={{ fontWeight: '600' }}
                  >
                    {(race.prize / 10000).toLocaleString()}만원
                  </StyledText>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon='calendar-outline'
            title={
              selectedVenue === 'all'
                ? '등록된 경주가 없습니다.'
                : `${selectedVenue}에 등록된 경주가 없습니다.`
            }
            message='다른 지역을 선택하거나 나중에 다시 확인해주세요.'
          />
        )}
      </Section>

      {/* 오늘의 경주 안내 */}
      <Card variant='compact' style={styles.infoSection}>
        <Ionicons name='information-circle' size={20} color={Colors.text.tertiary} />
        <StyledText variant='caption' color={Colors.text.tertiary} style={{ flex: 1 }}>
          오늘 진행되는 경주만 표시됩니다. 과거 기록은 &quot;결과&quot; 탭에서 확인하세요.
        </StyledText>
      </Card>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.xs,
  },
  filterButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.xs,
    backgroundColor: `${Colors.primary.main}10`,
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.dark,
  },
  filterButtonText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: Colors.text.primary,
  },
  raceCard: {
    marginBottom: Spacing.lg,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    marginBottom: Spacing.xs,
  },
  trackConditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  aiAnalysisSection: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: `${Colors.primary.main}10`,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  aiRecommendation: {
    lineHeight: 18,
  },
  raceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  raceTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: Spacing.xs,
  },
  prizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.primary.main}10`,
    borderColor: Colors.border.gold,
  },
});
