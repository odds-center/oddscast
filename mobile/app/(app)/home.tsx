import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { useAuth } from '@/context/AuthProvider';
import { useBetStatistics } from '@/lib/hooks/useBets';
import { useUserPointBalance } from '@/lib/hooks/usePoints';
import { useTodayRaces } from '@/lib/hooks/useRaces';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

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
  ],
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedRankingTab, setSelectedRankingTab] = useState('overall');

  // API 데이터 조회
  const { data: betStats, isLoading: betStatsLoading } = useBetStatistics();
  const { data: todayRaces, isLoading: racesLoading } = useTodayRaces();
  const { data: pointBalance } = useUserPointBalance();

  const getRankingTabLabel = (tab: string) => {
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

  return (
    <PageLayout>
      {/* 사용자 환영 메시지 */}
      <View style={styles.section}>
        <View style={styles.welcomeContainer}>
          <View style={styles.userInfo}>
            <ThemedText type='caption' style={styles.welcomeLabel}>
              AI 예측 게임
            </ThemedText>
            <ThemedText type='title' style={styles.welcomeText}>
              안녕하세요, {user?.name || '사용자'}님!
            </ThemedText>
            <ThemedText type='body' style={styles.welcomeSubtext}>
              오늘의 경주를 예측해보세요 🤖
            </ThemedText>
          </View>
          <View style={styles.userAvatar}>
            <Ionicons name='person-circle' size={40} color={GOLD_THEME.TEXT.SECONDARY} />
          </View>
        </View>
      </View>

      {/* 나의 기록 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          나의 기록
        </ThemedText>
        <View style={styles.bettingSummary}>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              {betStatsLoading ? '...' : betStats?.totalBets || 0}
            </ThemedText>
            <ThemedText type='caption' style={styles.bettingLabel}>
              베팅 기록
            </ThemedText>
          </View>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              {betStatsLoading ? '...' : betStats?.wonBets || 0}
            </ThemedText>
            <ThemedText type='caption' style={styles.bettingLabel}>
              적중
            </ThemedText>
          </View>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              {betStatsLoading ? '...' : `${Math.round(betStats?.winRate || 0)}%`}
            </ThemedText>
            <ThemedText type='caption' style={styles.bettingLabel}>
              승률
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 오늘의 경주 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          오늘의 경주
        </ThemedText>
        {racesLoading ? (
          <View style={styles.emptyContainer}>
            <ThemedText type='body' style={styles.emptyText}>
              경주 정보를 불러오는 중...
            </ThemedText>
          </View>
        ) : todayRaces && todayRaces.races && todayRaces.races.length > 0 ? (
          <View style={styles.racesList}>
            {todayRaces.races.slice(0, 3).map((race) => (
              <TouchableOpacity
                key={race.id}
                style={styles.raceCard}
                onPress={() => router.push(`/races/${race.id}`)}
              >
                <View style={styles.raceInfo}>
                  <ThemedText style={styles.raceName}>{race.rcName}</ThemedText>
                  <ThemedText style={styles.raceDetails}>
                    {race.meetName} • {race.rcDist}m • {race.rcStartTime}
                  </ThemedText>
                </View>
                <Ionicons name='chevron-forward' size={20} color='#666' />
              </TouchableOpacity>
            ))}
            {todayRaces.races.length > 3 && (
              <TouchableOpacity
                style={styles.moreRacesButton}
                onPress={() => router.push('/races')}
              >
                <ThemedText style={styles.moreRacesText}>
                  더 많은 경주 보기 ({todayRaces.races.length - 3}개 더)
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText type='body' style={styles.emptyText}>
              오늘 예정된 경주가 없습니다.
            </ThemedText>
          </View>
        )}
      </View>

      {/* 포인트 현황 */}
      <View style={styles.section}>
        <View style={styles.pointsHeader}>
          <View>
            <ThemedText type='title' style={styles.sectionTitle}>
              포인트
            </ThemedText>
            <ThemedText type='caption' style={styles.pointsSubtitle}>
              게임 내 가상 화폐
            </ThemedText>
          </View>
          <View style={styles.pointsBalance}>
            <ThemedText type='stat' style={styles.pointsNumber}>
              {pointBalance?.currentPoints?.toLocaleString() || '0'}
            </ThemedText>
            <ThemedText type='caption' style={styles.pointsLabel}>
              P
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 빠른 액션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          빠른 액션
        </ThemedText>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/betting')}>
            <View style={styles.actionIcon}>
              <Ionicons name='document-text' size={32} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.actionCardText}>베팅 기록</ThemedText>
            <ThemedText style={styles.actionCardSubtext}>외부 마권 등록</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/races')}>
            <View style={styles.actionIcon}>
              <Ionicons name='trophy' size={32} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.actionCardText}>경주 일정</ThemedText>
            <ThemedText style={styles.actionCardSubtext}>오늘의 경주</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/results')}>
            <View style={styles.actionIcon}>
              <Ionicons name='bar-chart' size={32} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.actionCardText}>경주 결과</ThemedText>
            <ThemedText style={styles.actionCardSubtext}>과거 기록 확인</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/mypage/favorites')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name='heart' size={32} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.actionCardText}>즐겨찾기</ThemedText>
            <ThemedText style={styles.actionCardSubtext}>관심 말 관리</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 랭킹 */}
      <View style={styles.section}>
        <View style={styles.rankingHeader}>
          <ThemedText type='title' style={styles.sectionTitle}>
            랭킹
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/ranking')}>
            <ThemedText type='caption' style={styles.seeAllText}>
              전체보기
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 랭킹 탭 */}
        <View style={styles.rankingTabs}>
          {['overall', 'weekly', 'monthly'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.rankingTab, selectedRankingTab === tab && styles.rankingTabActive]}
              onPress={() => setSelectedRankingTab(tab)}
            >
              <ThemedText
                type='caption'
                style={[
                  styles.rankingTabText,
                  selectedRankingTab === tab && styles.rankingTabTextActive,
                ]}
              >
                {getRankingTabLabel(tab)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 랭킹 목록 */}
        <View style={styles.rankingList}>
          {MOCK_RANKINGS[selectedRankingTab as keyof typeof MOCK_RANKINGS]
            .slice(0, 3)
            .map((ranking) => (
              <View key={ranking.id} style={styles.rankingCard}>
                <View style={styles.rankingItem}>
                  <View style={styles.rankingPosition}>
                    <ThemedText type='stat' style={styles.rankingNumber}>
                      {ranking.rank}
                    </ThemedText>
                    {ranking.rank <= 3 && (
                      <ThemedText style={styles.rankingMedal}>
                        {ranking.rank === 1 ? '🥇' : ranking.rank === 2 ? '🥈' : '🥉'}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.rankingUserSection}>
                    <View style={styles.rankingAvatar}>
                      <ThemedText style={styles.rankingAvatarText}>{ranking.avatar}</ThemedText>
                    </View>
                    <View style={styles.rankingInfo}>
                      <ThemedText type='body' style={styles.rankingName}>
                        {ranking.name}
                      </ThemedText>
                      <ThemedText type='caption' style={styles.rankingStats}>
                        {ranking.totalBets}회 • 승률 {ranking.winRate}%
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* 총 수익 섹션 */}
                <View style={styles.rankingWinningsSection}>
                  <ThemedText type='caption' style={styles.rankingWinningsLabel}>
                    총 수익
                  </ThemedText>
                  <ThemedText type='body' style={styles.rankingWinningsValue}>
                    {ranking.totalWinnings.toLocaleString()}원
                  </ThemedText>
                </View>
              </View>
            ))}
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  sectionTitle: {
    marginBottom: 16,
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  welcomeLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  welcomeText: {
    marginBottom: 4,
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  welcomeSubtext: {
    opacity: 0.8,
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bettingSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bettingStat: {
    alignItems: 'center',
  },
  bettingNumber: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 4,
  },
  bettingLabel: {
    opacity: 0.8,
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsSubtitle: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 12,
    marginTop: 4,
  },
  pointsBalance: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pointsNumber: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 32,
    fontWeight: '700',
  },
  pointsLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 18,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    minHeight: 140,
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    marginBottom: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    textAlign: 'center',
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  actionCardSubtext: {
    textAlign: 'center',
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 11,
    opacity: 0.8,
  },
  racesList: {
    gap: 12,
  },
  raceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  raceDetails: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
  },
  moreRacesButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  moreRacesText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 14,
    fontWeight: '500',
  },
  // 랭킹 스타일
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    textDecorationLine: 'underline',
  },
  rankingTabs: {
    flexDirection: 'row',
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  rankingTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  rankingTabActive: {
    backgroundColor: GOLD_THEME.GOLD.LIGHT,
  },
  rankingTabText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '500',
  },
  rankingTabTextActive: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontWeight: 'bold',
  },
  rankingList: {
    gap: 10,
  },
  rankingCard: {
    marginBottom: 0,
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
  rankingPosition: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingNumber: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: 'bold',
    fontSize: 18,
  },
  rankingMedal: {
    fontSize: 14,
    marginTop: 2,
  },
  rankingUserSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 8,
  },
  rankingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankingAvatarText: {
    fontSize: 20,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 16,
  },
  rankingStats: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 13,
    lineHeight: 16,
  },
  rankingWinningsSection: {
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
  rankingWinningsLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  rankingWinningsValue: {
    color: GOLD_THEME.GOLD.LIGHT,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 20,
  },
  // 다른 사용자 베팅 스타일
});
