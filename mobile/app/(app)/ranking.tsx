import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { GOLD_THEME } from '@/constants/theme';
import { useRankings, useMyRanking } from '@/lib/hooks/useRankings';

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
  const router = useRouter();
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
    <PageLayout>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color={GOLD_THEME.TEXT.PRIMARY} />
        </TouchableOpacity>
        <ThemedText type='title' style={styles.title}>
          랭킹
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

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
            총 베팅
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
                    승률 {getMyRanking().winRate}% • {getMyRanking().totalBets}회 베팅
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
          <ScrollView style={styles.rankingList} showsVerticalScrollIndicator={false}>
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
                      <ThemedText style={styles.avatarText}>{user.avatar}</ThemedText>
                    </View>
                    <View style={styles.userInfo}>
                      <ThemedText type='body' style={styles.userName}>
                        {user.name}
                      </ThemedText>
                      <ThemedText type='caption' style={styles.userStats}>
                        {user.totalBets}회 • 승률 {user.winRate}%
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
        </>
      )}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    margin: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: GOLD_THEME.GOLD.LIGHT,
  },
  tabText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '500',
  },
  tabTextActive: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  statsCard: {
    flex: 1,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  statsLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 6,
  },
  statsValue: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: 'bold',
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
  },
  rankingList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  rankingCard: {
    marginBottom: 10,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    padding: 14,
    minHeight: 70,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  rankSection: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    alignItems: 'center',
  },
  rankText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: 'bold',
    fontSize: 18,
  },
  rankIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 8,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 16,
  },
  userStats: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 13,
    lineHeight: 16,
  },
  scoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    maxWidth: 120,
  },
  winningsLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  winningsValue: {
    color: GOLD_THEME.GOLD.LIGHT,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 20,
  },
  winningsCurrency: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginTop: 3,
    fontSize: 11,
    textAlign: 'center',
  },
  winningsSection: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 12,
    paddingTop: 10,
    alignItems: 'center',
  },
  myRankingSection: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },
  myRankingCard: {
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: GOLD_THEME.GOLD.LIGHT,
  },
  myRankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  myRankingTitle: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
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
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  myRankText: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  myRankScore: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  myRankScoreLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 4,
    fontSize: 12,
  },
  myRankScoreValue: {
    color: GOLD_THEME.GOLD.LIGHT,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'right',
  },
});
