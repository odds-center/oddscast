import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import moment from 'moment';

// 디자인 시스템
import {
  StyledText,
  PageLayout,
  Card,
  Section,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  TabButton,
  SectionHeader,
} from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/designTokens';
import type { RaceResult } from '@/lib/api/resultApi';
import { useAllResults, useResults } from '@/lib/hooks/useResults';

export default function ResultsScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYYMMDD'));
  const [searchDate, setSearchDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // 선택된 날짜의 결과 조회
  const {
    data: dailyResults,
    isLoading: dailyLoading,
    error: dailyError,
    refetch: dailyRefetch,
  } = useResults(selectedDate);

  // 전체 결과 조회
  const {
    data: allResults,
    isLoading: allLoading,
    error: allError,
    refetch: allRefetch,
  } = useAllResults();

  // 현재 모드에 따른 데이터 선택
  const results = viewMode === 'daily' ? dailyResults : allResults;
  const isLoading = viewMode === 'daily' ? dailyLoading : allLoading;
  const error = viewMode === 'daily' ? dailyError : allError;
  const refetch = viewMode === 'daily' ? dailyRefetch : allRefetch;

  // 최근 30일 날짜 목록 생성
  useEffect(() => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      dates.push(moment().subtract(i, 'days').format('YYYYMMDD'));
    }
    setAvailableDates(dates);
  }, []);

  return (
    <PageLayout>
      <Section>
        <SectionHeader title='경주 결과' />

        {/* 뷰 모드 선택 */}
        <View style={styles.viewModeContainer}>
          <TabButton
            label='일별 조회'
            isActive={viewMode === 'daily'}
            onPress={() => setViewMode('daily')}
          />
          <TabButton
            label='전체 기록'
            isActive={viewMode === 'all'}
            onPress={() => setViewMode('all')}
          />
        </View>

        {/* 날짜 선택 */}
        {viewMode === 'daily' && (
          <View style={styles.dateSelector}>
            <TextInput
              style={styles.dateInput}
              placeholder='YYYYMMDD 형식으로 입력'
              placeholderTextColor={Colors.text.tertiary}
              value={searchDate}
              onChangeText={setSearchDate}
              onSubmitEditing={() => {
                if (searchDate && searchDate.length === 8) {
                  setSelectedDate(searchDate);
                  setSearchDate('');
                }
              }}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                if (searchDate && searchDate.length === 8) {
                  setSelectedDate(searchDate);
                  setSearchDate('');
                }
              }}
            >
              <StyledText variant='button' color={Colors.background.primary}>
                검색
              </StyledText>
            </TouchableOpacity>
          </View>
        )}

        {/* 최근 날짜 목록 */}
        {viewMode === 'daily' && (
          <View style={styles.recentDatesContainer}>
            <StyledText
              variant='caption'
              color={Colors.text.tertiary}
              style={styles.recentDatesTitle}
            >
              최근 날짜
            </StyledText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentDatesScroll}
            >
              {availableDates.slice(0, 10).map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateChip, selectedDate === date && styles.dateChipActive]}
                  onPress={() => setSelectedDate(date)}
                >
                  <StyledText
                    variant='caption'
                    style={[
                      styles.dateChipText,
                      selectedDate === date && styles.dateChipTextActive,
                    ]}
                  >
                    {moment(date, 'YYYYMMDD').format('MM/DD')}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 선택된 날짜 표시 */}
        <View style={styles.selectedDateContainer}>
          <StyledText variant='h4'>
            {moment(selectedDate, 'YYYYMMDD').format('YYYY년 MM월 DD일')}
          </StyledText>
          <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
            <StyledText
              variant='caption'
              color={Colors.text.secondary}
              style={{ fontWeight: '600' }}
            >
              새로고침
            </StyledText>
          </TouchableOpacity>
        </View>
      </Section>

      {/* 결과 목록 */}
      <Section>
        {isLoading ? (
          <LoadingSpinner message='결과를 불러오는 중...' />
        ) : error ? (
          <ErrorState
            error={error}
            title='결과를 불러오는데 실패했습니다'
            onRetry={() => refetch()}
          />
        ) : results && results.length > 0 ? (
          results.map((result: RaceResult) => (
            <Card key={result.id} variant='base' style={styles.resultCard}>
              <View style={styles.positionContainer}>
                <StyledText variant='h3' color={Colors.text.primary}>
                  {result.rcRank}
                </StyledText>
              </View>
              <View style={styles.horseInfo}>
                <StyledText variant='h4' style={styles.horseName}>
                  {result.hrName}
                </StyledText>
                <StyledText variant='caption' color={Colors.text.tertiary}>
                  기수: {result.jkName}
                </StyledText>
                <StyledText variant='caption' color={Colors.text.tertiary}>
                  조교사: {result.trName}
                </StyledText>
              </View>
              <View style={styles.resultDetails}>
                <StyledText variant='body' style={styles.finishTime}>
                  {result.rcTime}
                </StyledText>
                <StyledText variant='caption' color={Colors.text.tertiary}>
                  상금: {result.rcPrize?.toLocaleString() || 0}원
                </StyledText>
                <StyledText variant='caption' color={Colors.text.tertiary}>
                  거리: {result.rcDist}m
                </StyledText>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon='calendar-outline'
            title={viewMode === 'daily' ? '해당 날짜의 결과가 없습니다' : '전체 결과가 없습니다'}
            message='다른 날짜를 선택해보세요'
          />
        )}
      </Section>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  viewModeContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary.main}10`,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  dateSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border.gold,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    color: Colors.text.secondary,
    backgroundColor: `${Colors.primary.main}10`,
  },
  searchButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.dark,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  recentDatesContainer: {
    marginBottom: Spacing.lg,
  },
  recentDatesTitle: {
    marginBottom: Spacing.sm,
  },
  recentDatesScroll: {
    flexDirection: 'row',
  },
  dateChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    backgroundColor: `${Colors.primary.main}10`,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  dateChipActive: {
    backgroundColor: Colors.primary.dark,
    borderColor: Colors.primary.dark,
  },
  dateChipText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  dateChipTextActive: {
    color: Colors.text.primary,
  },
  selectedDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  refreshButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: `${Colors.primary.main}20`,
    borderRadius: BorderRadius.sm,
  },
  resultCard: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    shadowColor: Colors.primary.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  horseInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  horseName: {
    marginBottom: Spacing.xxs,
  },
  resultDetails: {
    alignItems: 'flex-end',
  },
  finishTime: {
    marginBottom: Spacing.xxs,
  },
});
