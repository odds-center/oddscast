import { ThemedText } from '@/components/ThemedText';
import { PageHeader } from '@/components/common';
import { PageLayout } from '@/components/common/PageLayout';
import { GOLD_THEME } from '@/constants/theme';
import { useMyRanking, useRankings } from '@/lib/hooks/useRankings';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

// Mock 랭킹 데이터 (전체/주간/월간)
const MOCK_RANKINGS = {
  overall: [
    {
      id: '1',
      rank: 1,
      name: '김마왕',
      avatar: '👑',
      winRate: 78.5,
      totalBets: 45,
      totalWinnings: 1250000,
      isCurrentUser: false,
    },
    {
      id: '2',
      rank: 2,
      name: '이경마',
      avatar: '🏇',
      winRate: 72.3,
      totalBets: 38,
      totalWinnings: 980000,
      isCurrentUser: false,
    },
    {
      id: '3',
      rank: 3,
      name: '박승부',
      avatar: '🎯',
      winRate: 68.9,
      totalBets: 52,
      totalWinnings: 850000,
      isCurrentUser: false,
    },
    {
      id: '4',
      rank: 4,
      name: '최예측',
      avatar: '🔮',
      winRate: 65.2,
      totalBets: 41,
      totalWinnings: 720000,
      isCurrentUser: false,
    },
    {
      id: '5',
      rank: 5,
      name: '정스마트',
      avatar: '🧠',
      winRate: 62.8,
      totalBets: 35,
      totalWinnings: 650000,
      isCurrentUser: false,
    },
    {
      id: '6',
      rank: 6,
      name: '한지혜',
      avatar: '🌟',
      winRate: 60.5,
      totalBets: 48,
      totalWinnings: 580000,
      isCurrentUser: false,
    },
    {
      id: '7',
      rank: 7,
      name: '강민수',
      avatar: '⚡',
      winRate: 58.2,
      totalBets: 33,
      totalWinnings: 520000,
      isCurrentUser: false,
    },
    {
      id: '8',
      rank: 8,
      name: '윤서연',
      avatar: '🎪',
      winRate: 55.8,
      totalBets: 42,
      totalWinnings: 480000,
      isCurrentUser: false,
    },
    {
      id: '9',
      rank: 9,
      name: '임동현',
      avatar: '🎲',
      winRate: 53.1,
      totalBets: 29,
      totalWinnings: 420000,
      isCurrentUser: false,
    },
    {
      id: '10',
      rank: 10,
      name: '조미래',
      avatar: '🎨',
      winRate: 50.7,
      totalBets: 36,
      totalWinnings: 380000,
      isCurrentUser: false,
    },
  ],
  weekly: [
    {
      id: '1',
      rank: 1,
      name: '박승부',
      avatar: '🎯',
      winRate: 85.7,
      totalBets: 7,
      totalWinnings: 180000,
      isCurrentUser: false,
    },
    {
      id: '2',
      rank: 2,
      name: '김마왕',
      avatar: '👑',
      winRate: 80.0,
      totalBets: 5,
      totalWinnings: 150000,
      isCurrentUser: false,
    },
    {
      id: '3',
      rank: 3,
      name: '이경마',
      avatar: '🏇',
      winRate: 75.0,
      totalBets: 4,
      totalWinnings: 120000,
      isCurrentUser: false,
    },
    {
      id: '4',
      rank: 4,
      name: '최예측',
      avatar: '🔮',
      winRate: 66.7,
      totalBets: 3,
      totalWinnings: 90000,
      isCurrentUser: false,
    },
    {
      id: '5',
      rank: 5,
      name: '정스마트',
      avatar: '🧠',
      winRate: 60.0,
      totalBets: 5,
      totalWinnings: 75000,
      isCurrentUser: false,
    },
  ],
  monthly: [
    {
      id: '1',
      rank: 1,
      name: '김마왕',
      avatar: '👑',
      winRate: 76.2,
      totalBets: 21,
      totalWinnings: 520000,
      isCurrentUser: false,
    },
    {
      id: '2',
      rank: 2,
      name: '박승부',
      avatar: '🎯',
      winRate: 73.1,
      totalBets: 26,
      totalWinnings: 480000,
      isCurrentUser: false,
    },
    {
      id: '3',
      rank: 3,
      name: '이경마',
      avatar: '🏇',
      winRate: 70.0,
      totalBets: 20,
      totalWinnings: 420000,
      isCurrentUser: false,
    },
    {
      id: '4',
      rank: 4,
      name: '최예측',
      avatar: '🔮',
      winRate: 67.5,
      totalBets: 18,
      totalWinnings: 380000,
      isCurrentUser: false,
    },
    {
      id: '5',
      rank: 5,
      name: '정스마트',
      avatar: '🧠',
      winRate: 64.3,
      totalBets: 16,
      totalWinnings: 320000,
      isCurrentUser: false,
    },
    {
      id: '6',
      rank: 6,
      name: '한지혜',
      avatar: '🌟',
      winRate: 61.9,
      totalBets: 22,
      totalWinnings: 280000,
      isCurrentUser: false,
    },
    {
      id: '7',
      rank: 7,
      name: '강민수',
      avatar: '⚡',
      winRate: 59.1,
      totalBets: 15,
      totalWinnings: 240000,
      isCurrentUser: false,
    },
    {
      id: '8',
      rank: 8,
      name: '윤서연',
      avatar: '🎪',
      winRate: 56.3,
      totalBets: 19,
      totalWinnings: 200000,
      isCurrentUser: false,
    },
  ],
};

export default function RankingScreen() {
  const [selectedTab, setSelectedTab] = useState<'overall' | 'weekly' | 'monthly'>('overall');

  // API 데이터 조회
  const { data: rankingsData, isLoading: rankingsLoading } = useRankings(selectedTab, 10);
  const { data: myRankingData, isLoading: myRankingLoading } = useMyRanking(selectedTab);

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'overall':
        return '전체';
      case 'weekly':
        return '주간';
      case 'monthly':
        return '월간';
      default:
        return '전체';
    }
  };

  const getCurrentRankings = () => {
    // API 데이터가 있으면 사용, 없으면 fallback
    if (rankingsData?.data) {
      return rankingsData.data;
    }
    return MOCK_RANKINGS[selectedTab as keyof typeof MOCK_RANKINGS] || MOCK_RANKINGS.overall;
  };

  const getMyRanking = () => {
    if (myRankingData?.data) {
      return myRankingData.data;
    }
    return {
      rank: 15,
      name: '나',
      avatar: '🎮',
      winRate: 45.2,
      totalBets: 12,
      totalWinnings: 180000,
      isCurrentUser: true,
    };
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  return (
    <PageLayout scrollable={false}>
      <PageHeader title='랭킹' />
      {/* 랭킹 탭 */}
      <View style={styles.tabContainer}>
        {(['overall', 'weekly', 'monthly'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <ThemedText
              type='body'
              style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}
            >
              {getTabLabel(tab)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* 랭킹 통계 */}
      <View style={styles.statsSection}>
        <View style={styles.statsCard}>
          <ThemedText type='caption' style={styles.statsLabel}>
            총 참여자
          </ThemedText>
          <ThemedText type='stat' style={styles.statsValue}>
            {getCurrentRankings().length}명
          </ThemedText>
        </View>
        <View style={styles.statsCard}>
          <ThemedText type='caption' style={styles.statsLabel}>
            평균 승률
          </ThemedText>
          <ThemedText type='stat' style={styles.statsValue}>
            {(
              getCurrentRankings().reduce((sum, user) => sum + user.winRate, 0) /
              getCurrentRankings().length
            ).toFixed(1)}
            %
          </ThemedText>
        </View>
        <View style={styles.statsCard}>
          <ThemedText type='caption' style={styles.statsLabel}>
            총 기록
          </ThemedText>
          <ThemedText type='stat' style={styles.statsValue}>
            {getCurrentRankings().reduce((sum, user) => sum + user.totalBets, 0)}회
          </ThemedText>
        </View>
      </View>

      {/* 로딩 상태 */}
      {rankingsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={GOLD_THEME.GOLD.LIGHT} />
          <ThemedText type='caption' style={styles.loadingText}>
            랭킹 데이터 불러오는 중...
          </ThemedText>
        </View>
      ) : (
        <>
          {/* 내 순위 (상단 고정) */}
          <View style={styles.myRankingSection}>
            <View style={styles.myRankingCard}>
              <View style={styles.myRankingHeader}>
                <ThemedText type='body' style={styles.myRankingTitle}>
                  내 순위
                </ThemedText>
                <Ionicons name='person' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              </View>
              <View style={styles.myRankingContent}>
                <View style={styles.myRankInfo}>
                  <ThemedText type='stat' style={styles.myRankNumber}>
                    {myRankingLoading ? '...' : `${getMyRanking().rank}위`}
                  </ThemedText>
                  <ThemedText type='caption' style={styles.myRankText}>
                    승률 {getMyRanking().winRate}% • {getMyRanking().totalBets}회 기록
                  </ThemedText>
                </View>
                <View style={styles.myRankScore}>
                  <ThemedText type='caption' style={styles.myRankScoreLabel}>
                    총 수익
                  </ThemedText>
                  <ThemedText type='body' style={styles.myRankScoreValue}>
                    {getMyRanking().totalWinnings.toLocaleString()}원
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* 랭킹 목록 */}
          <View style={styles.rankingListContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {getCurrentRankings().map((user) => (
                <View key={user.id} style={styles.rankingCard}>
                  <View style={styles.rankingItem}>
                    <View style={styles.rankSection}>
                      <View style={styles.rankNumber}>
                        <ThemedText type='stat' style={styles.rankText}>
                          {user.rank}
                        </ThemedText>
                      </View>
                      {getRankIcon(user.rank) && (
                        <ThemedText style={styles.rankIcon}>{getRankIcon(user.rank)}</ThemedText>
                      )}
                    </View>

                    <View style={styles.userSection}>
                      <View style={styles.userAvatar}>
                        <Ionicons
                          name='person-circle'
                          size={44}
                          color={GOLD_THEME.TEXT.SECONDARY}
                        />
                      </View>
                      <View style={styles.userInfo}>
                        <ThemedText type='body' style={styles.userName}>
                          {user.name}
                        </ThemedText>
                        <ThemedText type='caption' style={styles.userStats}>
                          {user.totalBets}회 기록 • 승률 {user.winRate}%
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* 총 수익 섹션을 별도로 아래에 배치 */}
                  <View style={styles.winningsSection}>
                    <ThemedText type='caption' style={styles.winningsLabel}>
                      총 수익
                    </ThemedText>
                    <ThemedText type='body' style={styles.winningsValue}>
                      {user.totalWinnings.toLocaleString()}원
                    </ThemedText>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
  },
  tabText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 22,
  },
  tabTextActive: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
    minHeight: 80,
    justifyContent: 'center',
  },
  statsLabel: {
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  statsValue: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 26,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  rankingListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rankingCard: {
    marginBottom: 12,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    padding: 16,
    minHeight: 76,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  rankSection: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    alignItems: 'center',
  },
  rankText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
  },
  rankIcon: {
    fontSize: 16,
    marginTop: 4,
    lineHeight: 20,
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    lineHeight: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 16,
    lineHeight: 24,
  },
  userStats: {
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    fontSize: 13,
    lineHeight: 20,
  },
  scoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    maxWidth: 120,
  },
  winningsLabel: {
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    marginBottom: 6,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  winningsValue: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  winningsCurrency: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 3,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  winningsSection: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 2,
    borderColor: GOLD_THEME.BORDER.GOLD,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    paddingTop: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  myRankingSection: {
    paddingTop: 0,
    paddingBottom: 20,
  },
  myRankingCard: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: GOLD_THEME.TEXT.SECONDARY,
    minHeight: 100,
  },
  myRankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  myRankingTitle: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
  },
  myRankingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myRankInfo: {
    flex: 1,
  },
  myRankNumber: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 6,
  },
  myRankText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    fontSize: 13,
    lineHeight: 20,
  },
  myRankScore: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  myRankScoreLabel: {
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    marginBottom: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  myRankScoreValue: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'right',
    lineHeight: 24,
  },
});
