import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { useAuth } from '@/context/AuthProvider';
import { useBetStatistics } from '@/lib/hooks/useBets';
import { useUserPointBalance } from '@/lib/hooks/usePoints';
import { useTodayRaces } from '@/lib/hooks/useRaces';
import { BetResult } from '@/lib/types/bet';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, resetAuth } = useAuth();

  // API 데이터 조회
  const { data: betStats, isLoading: betStatsLoading } = useBetStatistics();
  const { data: todayRaces, isLoading: racesLoading } = useTodayRaces();
  const { data: pointBalance, isLoading: pointsLoading } = useUserPointBalance();

  // 토큰 재설정 함수
  const handleTokenReset = async () => {
    try {
      await resetAuth();
      console.log('토큰 재설정 완료');
    } catch (error) {
      console.error('토큰 재설정 실패:', error);
    }
  };

  return (
    <PageLayout>
      {/* 사용자 환영 메시지 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          환영합니다!
        </ThemedText>
        <View style={styles.welcomeContainer}>
          <View style={styles.userInfo}>
            <ThemedText type='title' style={styles.welcomeText}>
              안녕하세요, {user?.name || '사용자'}님!
            </ThemedText>
            <ThemedText type='body' style={styles.welcomeSubtext}>
              오늘도 행운을 빕니다 🍀
            </ThemedText>
          </View>
          <View style={styles.userAvatar}>
            <Ionicons name='person-circle' size={40} color={GOLD_THEME.TEXT.SECONDARY} />
          </View>
        </View>
      </View>

      {/* 베팅 현황 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          베팅 현황
        </ThemedText>
        <View style={styles.bettingSummary}>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              {betStatsLoading ? '...' : betStats?.totalBets || 0}
            </ThemedText>
            <ThemedText type='caption' style={styles.bettingLabel}>
              총 베팅
            </ThemedText>
          </View>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              {betStatsLoading ? '...' : betStats?.byResult?.[BetResult.WIN]?.count || 0}
            </ThemedText>
            <ThemedText type='caption' style={styles.bettingLabel}>
              당첨
            </ThemedText>
          </View>
          <View style={styles.bettingStat}>
            <ThemedText type='stat' style={styles.bettingNumber}>
              {betStatsLoading ? '...' : `${Math.round((betStats?.winRate || 0) * 100)}%`}
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

      {/* 빠른 액션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          빠른 액션
        </ThemedText>
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/betting')}>
            <View style={styles.featureIcon}>
              <Ionicons name='game-controller' size={28} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.actionCardText}>베팅하기</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/races')}>
            <View style={styles.featureIcon}>
              <Ionicons name='trophy' size={28} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.actionCardText}>경주 보기</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/points')}>
            <View style={styles.featureIcon}>
              <Ionicons name='wallet' size={28} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.actionCardText}>포인트</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/mypage')}>
            <View style={styles.featureIcon}>
              <Ionicons name='person' size={28} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.actionCardText}>마이페이지</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 토큰 디버깅 (개발용) */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          토큰 디버깅
        </ThemedText>
        <TouchableOpacity style={styles.debugButton} onPress={handleTokenReset}>
          <ThemedText style={styles.debugButtonText}>토큰 재설정</ThemedText>
        </TouchableOpacity>
      </View>

      {/* 더 많은 기능 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          더 많은 기능
        </ThemedText>
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/results')}>
            <View style={styles.featureIcon}>
              <Ionicons name='analytics' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.featureCardText}>결과 보기</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/favorites')}>
            <View style={styles.featureIcon}>
              <Ionicons name='heart' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.featureCardText}>즐겨찾기</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/mypage/help')}>
            <View style={styles.featureIcon}>
              <Ionicons name='help-circle' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.featureCardText}>도움말</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push('/mypage/settings')}
          >
            <View style={styles.featureIcon}>
              <Ionicons name='settings' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
            </View>
            <ThemedText style={styles.featureCardText}>설정</ThemedText>
          </TouchableOpacity>
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
  // 빠른 액션 섹션 스타일 (2x2 그리드)
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: GOLD_THEME.GOLD.LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    marginBottom: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    textAlign: 'center',
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  // 더 많은 기능 섹션 스타일 (2x2 그리드로 통일)
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
    minHeight: 100,
    justifyContent: 'center',
  },
  featureIcon: {
    marginBottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCardText: {
    textAlign: 'center',
    color: GOLD_THEME.TEXT.PRIMARY,
    fontWeight: '500',
    fontSize: 12,
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
    backgroundColor: GOLD_THEME.BACKGROUND.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
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
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
    fontSize: 14,
  },
  moreRacesButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  moreRacesText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 14,
    fontWeight: '500',
  },
  debugButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
});
