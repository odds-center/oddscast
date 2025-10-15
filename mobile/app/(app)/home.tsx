import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { GOLD_THEME } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { useBetStatistics } from '@/lib/hooks/useBets';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useSubscriptionPlans } from '@/lib/hooks/useSubscriptionPlans';
import { useSinglePurchaseConfig } from '@/lib/hooks/useSinglePurchaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RACES } from '@/constants/mockData';
import { Card, Section, StatCard, EmptyState, InfoBanner, Button } from '@/components/ui';
import { TicketBadge } from '@/components/common/TicketBadge';

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
  const { isSubscribed } = useSubscription();
  const { data: plans } = useSubscriptionPlans();
  const { data: singleConfig } = useSinglePurchaseConfig();

  // 프리미엄 플랜 정보 (DB에서)
  const premiumPlan = useMemo(() => {
    if (!plans || plans.length === 0 || !singleConfig) return null;
    const plan = plans.find((p) => p.planName === 'PREMIUM');
    if (!plan) return null;

    const SINGLE_PRICE = singleConfig.totalPrice; // DB에서 가져온 개별 구매 가격
    const pricePerTicket = Math.round(plan.totalPrice / plan.totalTickets);
    const discount = Math.round(
      ((SINGLE_PRICE * plan.totalTickets - plan.totalPrice) / (SINGLE_PRICE * plan.totalTickets)) *
        100
    );
    const savings = SINGLE_PRICE * plan.totalTickets - plan.totalPrice;

    return { ...plan, pricePerTicket, discount, savings };
  }, [plans, singleConfig]);

  // Mock 경주 데이터 사용 (최대 3개만)
  const todayRaces = RACES.slice(0, 3);

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
      {/* 사용자 환영 메시지 + 예측권 Badge */}
      <Section>
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
          <View style={styles.headerRight}>
            <TicketBadge />
            <View style={styles.userAvatar}>
              <Ionicons name='person-circle' size={32} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
          </View>
        </View>
      </Section>

      {/* 나의 기록 - 신규 Section & StatCard 사용 */}
      <Section>
        <ThemedText type='title' style={styles.sectionTitle}>
          나의 기록
        </ThemedText>
        <View style={styles.bettingSummary}>
          <StatCard
            icon='document-text'
            label='마권 기록'
            value={betStatsLoading ? '...' : betStats?.totalBets || 0}
            variant='default'
          />
          <StatCard
            icon='trophy'
            label='적중'
            value={betStatsLoading ? '...' : betStats?.wonBets || 0}
            variant='highlight'
          />
          <StatCard
            icon='trending-up'
            label='승률'
            value={betStatsLoading ? '...' : `${Math.round(betStats?.winRate || 0)}%`}
            variant='default'
          />
        </View>
      </Section>

      {/* 빠른 액션 - Card 사용 */}
      <Card variant='elevated' style={styles.quickActionsCard}>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/records')}>
            <Ionicons name='document-text' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='caption' style={styles.quickActionText}>
              마권 기록
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/races')}>
            <Ionicons name='trophy' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='caption' style={styles.quickActionText}>
              경주 일정
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/results')}>
            <Ionicons name='bar-chart' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='caption' style={styles.quickActionText}>
              경주 결과
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/mypage/favorites')}
          >
            <Ionicons name='heart' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='caption' style={styles.quickActionText}>
              즐겨찾기
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Card>

      {/* 오늘의 경주 */}
      <View style={styles.racesSection}>
        <View style={styles.racesSectionHeader}>
          <ThemedText type='title' style={styles.racesSectionTitle}>
            오늘의 경주
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/races')}>
            <ThemedText type='caption' style={styles.seeAllText}>
              전체보기
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {todayRaces.length > 0 ? (
        <View style={styles.racesList}>
          {todayRaces.map((race) => (
            <TouchableOpacity
              key={race.id}
              style={styles.raceCard}
              onPress={() => router.push(`/race-detail/${race.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.raceCardHeader}>
                <View style={styles.raceInfo}>
                  <View style={styles.raceNameRow}>
                    <ThemedText type='subtitle' style={styles.raceName}>
                      {race.raceName}
                    </ThemedText>
                    <View style={styles.raceGradeBadge}>
                      <ThemedText type='caption' style={styles.raceGradeText}>
                        {race.grade}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type='caption' style={styles.raceDetails}>
                    {race.venue} • {race.distance}m • {race.date.split(' ')[1]}
                  </ThemedText>
                </View>
              </View>

              {/* 트랙 컨디션 간략 표시 */}
              <View style={styles.raceConditionRow}>
                <Ionicons
                  name={
                    race.trackCondition.weather === 'sunny'
                      ? 'sunny'
                      : race.trackCondition.weather === 'cloudy'
                      ? 'cloudy'
                      : race.trackCondition.weather === 'rainy'
                      ? 'rainy'
                      : 'cloud'
                  }
                  size={14}
                  color={GOLD_THEME.TEXT.SECONDARY}
                />
                <ThemedText type='caption' style={styles.conditionText}>
                  {race.trackCondition.temperature}°C
                </ThemedText>
                <ThemedText type='caption' style={styles.conditionDivider}>
                  •
                </ThemedText>
                <Ionicons name='speedometer' size={14} color={GOLD_THEME.TEXT.SECONDARY} />
                <ThemedText type='caption' style={styles.conditionText}>
                  {race.trackCondition.surface === 'fast'
                    ? '빠름'
                    : race.trackCondition.surface === 'good'
                    ? '양호'
                    : race.trackCondition.surface === 'soft'
                    ? '습함'
                    : '무거움'}
                </ThemedText>
              </View>

              {/* AI 예측 */}
              <View style={styles.raceAiSection}>
                <View style={styles.aiIconRow}>
                  <Ionicons name='analytics' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
                  <ThemedText type='caption' style={styles.aiLabel}>
                    AI 예측
                  </ThemedText>
                  <View style={styles.aiConfidenceBadge}>
                    <ThemedText type='caption' style={styles.aiConfidenceText}>
                      {race.aiAnalysis.confidence}%
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type='caption' style={styles.aiRecommendationText} numberOfLines={2}>
                  {race.aiAnalysis.recommendation}
                </ThemedText>

                {/* 시간과 상금 정보 */}
                <View style={styles.raceTimePrizeRow}>
                  <View style={styles.raceTimeInfo}>
                    <Ionicons name='time' size={14} color={GOLD_THEME.TEXT.SECONDARY} />
                    <ThemedText type='caption' style={styles.raceTimeText}>
                      {race.date.split(' ')[1]}
                    </ThemedText>
                  </View>
                  <View style={styles.racePrizeInfo}>
                    <Ionicons name='trophy' size={14} color={GOLD_THEME.TEXT.SECONDARY} />
                    <ThemedText type='caption' style={styles.racePrizeText}>
                      {(race.prize / 10000).toLocaleString()}만원
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* 실시간 인기 말 */}
              <View style={styles.popularHorseSection}>
                <View style={styles.popularHorseHeader}>
                  <Ionicons name='flame' size={14} color='#FF6B35' />
                  <ThemedText type='caption' style={styles.popularHorseLabel}>
                    실시간 인기 말
                  </ThemedText>
                </View>
                {race.horses
                  .sort((a, b) => a.bettingStats.popularityRank - b.bettingStats.popularityRank)
                  .slice(0, 3)
                  .map((horse, index) => (
                    <View key={horse.id} style={styles.popularHorseItem}>
                      <View style={styles.popularHorseRank}>
                        <ThemedText type='caption' style={styles.popularHorseRankText}>
                          {horse.bettingStats.popularityRank}
                        </ThemedText>
                      </View>
                      <View style={styles.popularHorseInfo}>
                        <ThemedText
                          type='caption'
                          style={styles.popularHorseName}
                          numberOfLines={1}
                        >
                          {horse.horseName}
                        </ThemedText>
                        <ThemedText type='caption' style={styles.popularHorseBets}>
                          {horse.bettingStats.totalBets.toLocaleString()}명 구매
                        </ThemedText>
                      </View>
                      <View style={styles.popularHorseBar}>
                        <View
                          style={[
                            styles.popularHorseBarFill,
                            {
                              width: `${
                                (horse.bettingStats.totalBets /
                                  race.horses
                                    .map((h) => h.bettingStats.totalBets)
                                    .reduce((a, b) => Math.max(a, b), 0)) *
                                100
                              }%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <EmptyState
          icon='calendar-outline'
          title='오늘 예정된 경주가 없습니다'
          message='다른 날짜를 확인해보세요'
        />
      )}

      {/* AI 예측권 구독 배너 - 구독하지 않은 경우에만 표시 */}
      {!isSubscribed && (
        <TouchableOpacity
          style={styles.subscriptionBanner}
          onPress={() => router.push('/mypage/subscription/plans')}
          activeOpacity={0.9}
        >
          {/* 헤더 */}
          <View style={styles.bannerHeader}>
            <View style={styles.bannerTitleContainer}>
              <Ionicons name='diamond' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='title' style={styles.bannerTitle}>
                AI 예측권 프리미엄
              </ThemedText>
            </View>
            <LinearGradient
              colors={[GOLD_THEME.GOLD.LIGHT, GOLD_THEME.GOLD.DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badgeNew}
            >
              <ThemedText type='caption' style={styles.badgeText}>
                BEST
              </ThemedText>
            </LinearGradient>
          </View>

          {/* 가격 */}
          <View style={styles.priceSection}>
            <ThemedText style={styles.priceAmount}>19,800원</ThemedText>
            <ThemedText style={styles.pricePeriod}>/월</ThemedText>
          </View>

          {/* 주요 혜택 */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='default' style={styles.featureText}>
                월 24장 AI 예측권 (20+4)
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='default' style={styles.featureText}>
                장당 825원 (25% 할인)
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='default' style={styles.featureText}>
                평균 70%+ 정확도 목표
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='default' style={styles.featureText}>
                자동 갱신
              </ThemedText>
            </View>
          </View>

          {/* 절약 정보 */}
          <View style={styles.savings}>
            <Ionicons name='bulb' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText type='defaultSemiBold' style={styles.savingsText}>
              개별 구매 대비 월 10,200원 절약!
            </ThemedText>
          </View>
        </TouchableOpacity>
      )}

      {/* 랭킹 - Section 컴포넌트 사용 */}
      <Section>
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
      </Section>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 12,
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
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
    gap: 12,
  },
  racesSection: {
    marginBottom: 16,
  },
  racesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  racesSectionTitle: {
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  racesList: {
    gap: 16,
  },
  raceCard: {
    padding: 18,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  raceCardHeader: {
    marginBottom: 10,
  },
  raceInfo: {
    flex: 1,
  },
  raceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  raceName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '700',
    flex: 1,
  },
  raceGradeBadge: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  raceGradeText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '700',
  },
  raceDetails: {
    color: GOLD_THEME.TEXT.TERTIARY,
  },
  raceConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 8,
    gap: 6,
  },
  conditionText: {
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  conditionDivider: {
    color: GOLD_THEME.TEXT.TERTIARY,
    marginHorizontal: 2,
  },
  raceAiSection: {
    padding: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 8,
    marginBottom: 8,
  },
  aiIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  aiLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '600',
    flex: 1,
  },
  aiConfidenceBadge: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiConfidenceText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '700',
  },
  aiRecommendationText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    lineHeight: 20,
    marginBottom: 8,
  },
  raceTimePrizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.15)',
  },
  raceTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raceTimeText: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  racePrizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  racePrizeText: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  popularHorseSection: {
    marginTop: 0,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderRadius: 8,
  },
  popularHorseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  popularHorseLabel: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '700',
  },
  popularHorseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  popularHorseRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularHorseRankText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '700',
  },
  popularHorseInfo: {
    flex: 1,
    minWidth: 0,
  },
  popularHorseName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  popularHorseBets: {
    color: GOLD_THEME.TEXT.TERTIARY,
  },
  popularHorseBar: {
    width: 60,
    height: 6,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 3,
    overflow: 'hidden',
  },
  popularHorseBarFill: {
    height: '100%',
    backgroundColor: GOLD_THEME.TEXT.SECONDARY,
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    textDecorationLine: 'underline',
  },
  // 랭킹 스타일
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  rankingTabActive: {
    backgroundColor: GOLD_THEME.GOLD.LIGHT,
    borderColor: GOLD_THEME.GOLD.MEDIUM,
  },
  rankingTabText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '600',
    fontSize: 14,
  },
  rankingTabTextActive: {
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    fontWeight: 'bold',
    fontSize: 14,
  },
  rankingList: {
    gap: 10,
  },
  rankingCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 70,
    borderBottomWidth: 0,
  },
  rankingPosition: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingNumber: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: 'bold',
    fontSize: 16,
  },
  rankingMedal: {
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
  rankingAvatarText: {},
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
  },
  rankingStats: {
    color: GOLD_THEME.TEXT.SECONDARY,
    lineHeight: 16,
  },
  rankingWinningsSection: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    borderTopWidth: 1,
    borderTopColor: GOLD_THEME.BORDER.GOLD,
    padding: 12,
    paddingTop: 12,
    alignItems: 'center',
  },
  rankingWinningsLabel: {
    color: GOLD_THEME.TEXT.SECONDARY,
    marginBottom: 6,
    textAlign: 'center',
  },
  rankingWinningsValue: {
    color: GOLD_THEME.GOLD.LIGHT,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // 다른 사용자 베팅 스타일
  // 구독 배너 스타일
  subscriptionBanner: {
    marginBottom: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    padding: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bannerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerTitle: {
    fontWeight: '700',
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 18,
    lineHeight: 24,
  },
  badgeNew: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: GOLD_THEME.GOLD.LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontWeight: '800',
    color: GOLD_THEME.BACKGROUND.PRIMARY,
    letterSpacing: 0.5,
    backgroundColor: 'transparent',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceAmount: {
    fontWeight: '700',
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 36,
    lineHeight: 44,
  },
  pricePeriod: {
    color: GOLD_THEME.TEXT.PRIMARY,
    marginLeft: 4,
    opacity: 0.7,
    fontSize: 18,
    lineHeight: 24,
  },
  features: {
    marginBottom: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
  },
  featureText: {
    color: GOLD_THEME.TEXT.PRIMARY,
  },
  savings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    minHeight: 44,
  },
  savingsText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontWeight: '600',
  },
  quickActionsCard: {
    padding: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    textAlign: 'center',
  },
});
