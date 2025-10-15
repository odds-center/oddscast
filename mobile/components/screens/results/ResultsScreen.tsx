import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { GOLD_THEME } from '@/constants/theme';
import type { RaceResult } from '@/lib/api/resultApi';
import { useAllResults, useResults } from '@/lib/hooks/useResults';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { LoadingSpinner, ErrorState, EmptyState, Button } from '@/components/ui';

// Mock 과거 경주 기록
const MOCK_PAST_RESULTS = [
  {
    id: '1',
    rcName: '한라산배',
    meetName: '제주',
    rcNo: '7',
    rcDist: '1200',
    rcGrade: 'G2',
    rcDate: '20251008',
    rcDay: '화요일',
    winner: {
      hrName: '황금마',
      hrNo: '3',
      jkName: '김철수',
      winOdds: '4.5',
    },
  },
  {
    id: '2',
    rcName: '서울 스프린트',
    meetName: '서울',
    rcNo: '11',
    rcDist: '1000',
    rcGrade: 'G3',
    rcDate: '20251007',
    rcDay: '월요일',
    winner: {
      hrName: '번개',
      hrNo: '7',
      jkName: '이영희',
      winOdds: '2.3',
    },
  },
  {
    id: '3',
    rcName: '부산컵',
    meetName: '부산',
    rcNo: '9',
    rcDist: '1800',
    rcGrade: 'G1',
    rcDate: '20251006',
    rcDay: '일요일',
    winner: {
      hrName: '대왕',
      hrNo: '5',
      jkName: '박민수',
      winOdds: '6.8',
    },
  },
  {
    id: '4',
    rcName: '제주 챔피언십',
    meetName: '제주',
    rcNo: '8',
    rcDist: '1600',
    rcGrade: 'G2',
    rcDate: '20251005',
    rcDay: '토요일',
    winner: {
      hrName: '질주',
      hrNo: '2',
      jkName: '정수진',
      winOdds: '3.1',
    },
  },
];

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
      {/* 헤더 */}
      <View style={styles.header}>
        <ThemedText type='title' style={styles.title}>
          경주 결과
        </ThemedText>

        {/* 뷰 모드 선택 */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'daily' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('daily')}
          >
            <ThemedText
              style={[styles.viewModeText, viewMode === 'daily' && styles.viewModeTextActive]}
            >
              일별 조회
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'all' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('all')}
          >
            <ThemedText
              style={[styles.viewModeText, viewMode === 'all' && styles.viewModeTextActive]}
            >
              전체 기록
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 날짜 선택 */}
        {viewMode === 'daily' && (
          <View style={styles.dateSelector}>
            <TextInput
              style={styles.dateInput}
              placeholder='YYYYMMDD 형식으로 입력'
              placeholderTextColor='rgba(180, 138, 60, 0.6)'
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
              <ThemedText style={styles.searchButtonText}>검색</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* 최근 날짜 목록 */}
        {viewMode === 'daily' && (
          <View style={styles.recentDatesContainer}>
            <ThemedText type='caption' style={styles.recentDatesTitle}>
              최근 날짜
            </ThemedText>
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
                  <ThemedText
                    style={[
                      styles.dateChipText,
                      selectedDate === date && styles.dateChipTextActive,
                    ]}
                  >
                    {moment(date, 'YYYYMMDD').format('MM/DD')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 선택된 날짜 표시 */}
        <View style={styles.selectedDateContainer}>
          <ThemedText type='subtitle' style={styles.selectedDateText}>
            {moment(selectedDate, 'YYYYMMDD').format('YYYY년 MM월 DD일')}
          </ThemedText>
          <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
            <ThemedText style={styles.refreshButtonText}>새로고침</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 결과 목록 - 신규 컴포넌트 사용 */}
      <View style={styles.content}>
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
            <View key={result.id} style={styles.resultCard}>
              <View style={styles.positionContainer}>
                <ThemedText type='stat' style={styles.position}>
                  {result.rcRank}
                </ThemedText>
              </View>
              <View style={styles.horseInfo}>
                <ThemedText type='subtitle' style={styles.horseName}>
                  {result.hrName}
                </ThemedText>
                <ThemedText type='caption' style={styles.jockeyName}>
                  기수: {result.jkName}
                </ThemedText>
                <ThemedText type='caption' style={styles.trainerName}>
                  조교사: {result.trName}
                </ThemedText>
              </View>
              <View style={styles.resultDetails}>
                <ThemedText type='default' style={styles.finishTime}>
                  {result.rcTime}
                </ThemedText>
                <ThemedText type='caption' style={styles.odds}>
                  상금: {result.rcPrize?.toLocaleString() || 0}원
                </ThemedText>
                <ThemedText type='caption' style={styles.distance}>
                  거리: {result.rcDist}m
                </ThemedText>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon='calendar-outline'
            title={viewMode === 'daily' ? '해당 날짜의 결과가 없습니다' : '전체 결과가 없습니다'}
            message='다른 날짜를 선택해보세요'
          />
        )}
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.PRIMARY,
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  content: {
    flex: 1,
  },
  resultCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  positionContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: GOLD_THEME.GOLD.DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  position: {
    color: GOLD_THEME.TEXT.PRIMARY,
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
  // 뷰 모드 관련 스타일
  viewModeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
  },
  viewModeText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '600',
    opacity: 0.8,
  },
  viewModeTextActive: {
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  // 날짜 선택 관련 스타일
  dateSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    color: GOLD_THEME.TEXT.SECONDARY,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderRadius: 8,
  },
  searchButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
  },
  // 최근 날짜 관련 스타일
  recentDatesContainer: {
    marginBottom: 16,
  },
  recentDatesTitle: {
    marginBottom: 8,
    color: GOLD_THEME.TEXT.SECONDARY,
    opacity: 0.8,
  },
  recentDatesScroll: {
    flexDirection: 'row',
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  dateChipActive: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderColor: GOLD_THEME.GOLD.DARK,
  },
  dateChipText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  dateChipTextActive: {
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  // 선택된 날짜 표시 관련 스타일
  selectedDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '600',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 6,
  },
  refreshButtonText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 12,
    fontWeight: '600',
  },
  // 결과 카드 추가 스타일
  trainerName: {
    opacity: 0.6,
    marginTop: 2,
  },
  distance: {
    opacity: 0.6,
    marginTop: 2,
  },
});
