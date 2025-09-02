import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { NotificationSettingsModal } from '@/components/modals/NotificationSettingsModal';
import { PointsEarnModal } from '@/components/modals/PointsEarnModal';
import { PointsUseModal } from '@/components/modals/PointsUseModal';
import { ProfileEditModal } from '@/components/modals/ProfileEditModal';
import { POINTS_UTILS } from '@/constants/points';
import { useAuth } from '@/context/AuthProvider';
import { useModal } from '@/hooks/useModal';
import { useBetStatistics } from '@/lib/hooks/useBets';
import { useUserPointBalance } from '@/lib/hooks/usePoints';
import { useCurrentUserProfile } from '@/lib/hooks/useUsers';
import { BetResult } from '@/lib/types/bet';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const MyPageScreen = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { showModal } = useModal();

  // API 데이터 조회
  const { data: userProfile, isLoading: profileLoading } = useCurrentUserProfile();
  const { data: pointBalance, isLoading: pointsLoading } = useUserPointBalance();
  const { data: betStats, isLoading: betStatsLoading } = useBetStatistics();

  // 포인트 관련 상태 (API 데이터가 없을 때 기본값)
  const userPoints = pointBalance?.currentPoints || 125000;

  // 현재 레벨과 다음 레벨 계산
  const currentLevel = POINTS_UTILS.getUserLevel(userPoints);
  const nextLevel = POINTS_UTILS.getNextLevel(userPoints);
  const progressPercentage = nextLevel ? (userPoints / nextLevel.MIN_POINTS) * 100 : 100;

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('로그아웃 성공');
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  };

  const handleDeleteAccount = () => {
    console.log('계정 삭제 기능이 곧 추가될 예정입니다.');
  };

  const handleMenuPress = (menuName: string) => {
    switch (menuName) {
      case '프로필 편집':
        showModal(<ProfileEditModal onClose={() => {}} />, '프로필 편집');
        break;
      case '즐겨찾기':
        router.push('/mypage/favorites');
        break;
      case '알림 설정':
        showModal(<NotificationSettingsModal onClose={() => {}} />, '알림 설정');
        break;
      case '도움말':
        router.push('/mypage/help');
        break;
      case '포인트 획득':
        showModal(<PointsEarnModal onClose={() => {}} />, '포인트 획득 방법');
        break;
      case '포인트 사용':
        showModal(<PointsUseModal onClose={() => {}} />, '포인트 사용 방법');
        break;
      default:
        console.log(`${menuName} 기능이 곧 추가될 예정입니다.`);
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <View style={styles.centerContainer}>
          <ThemedText type='title' style={styles.errorText}>
            로그인이 필요합니다.
          </ThemedText>
        </View>
      </PageLayout>
    );
  }

  const username = userProfile?.name || user?.name || user?.email?.split('@')[0] || '사용자';
  const email = userProfile?.email || user?.email || '';

  return (
    <PageLayout>
      {/* 프로필 섹션 */}
      <View style={styles.section}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name='person' size={32} color='#FFFFFF' />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type='title' style={styles.username}>
              {username}
            </ThemedText>
            <ThemedText type='body' style={styles.email}>
              {email}
            </ThemedText>
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <ThemedText type='stat' style={styles.statNumber}>
                  {betStatsLoading ? '...' : betStats?.totalBets || 0}
                </ThemedText>
                <ThemedText type='caption' style={styles.statLabel}>
                  총 베팅
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type='stat' style={styles.statNumber}>
                  {betStatsLoading ? '...' : betStats?.byResult?.[BetResult.WIN]?.count || 0}
                </ThemedText>
                <ThemedText type='caption' style={styles.statLabel}>
                  승리
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type='stat' style={styles.statNumber}>
                  {betStatsLoading ? '...' : `${Math.round((betStats?.winRate || 0) * 100)}%`}
                </ThemedText>
                <ThemedText type='caption' style={styles.statLabel}>
                  승률
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 포인트 섹션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          포인트
        </ThemedText>
        <View style={styles.balanceContainer}>
          <View style={styles.balanceInfo}>
            <ThemedText type='caption' style={styles.balanceLabel}>
              현재 포인트
            </ThemedText>
            <ThemedText type='title' style={styles.balanceAmount}>
              {userPoints.toLocaleString()}P
            </ThemedText>
          </View>
          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMenuPress('포인트 획득')}
            >
              <Ionicons name='gift' size={16} color='#FFFFFF' />
              <ThemedText style={styles.actionButtonText}>획득</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMenuPress('포인트 사용')}
            >
              <Ionicons name='card' size={16} color='#FFFFFF' />
              <ThemedText style={styles.actionButtonText}>사용</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 레벨 정보 */}
        <View style={styles.levelContainer}>
          <View style={styles.currentLevel}>
            <View style={styles.levelBadge}>
              <Ionicons name='star' size={16} color='#E5C99C' />
              <ThemedText style={styles.levelText}>{currentLevel.NAME}</ThemedText>
            </View>
            <ThemedText type='caption' style={styles.levelDescription}>
              {currentLevel.LABEL} 레벨
            </ThemedText>
          </View>

          {nextLevel && (
            <View style={styles.levelProgress}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
              <ThemedText type='caption' style={styles.progressText}>
                다음 레벨까지 {nextLevel ? (nextLevel.MIN_POINTS - userPoints).toLocaleString() : 0}
                P 남음
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* 메뉴 섹션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          설정
        </ThemedText>
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('프로필 편집')}>
            <View style={styles.menuIcon}>
              <Ionicons name='person' size={20} color='#E5C99C' />
            </View>
            <ThemedText style={styles.menuText}>프로필 편집</ThemedText>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('즐겨찾기')}>
            <View style={styles.menuIcon}>
              <Ionicons name='heart' size={20} color='#E5C99C' />
            </View>
            <ThemedText style={styles.menuText}>즐겨찾기</ThemedText>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('알림 설정')}>
            <View style={styles.menuIcon}>
              <Ionicons name='notifications' size={20} color='#E5C99C' />
            </View>
            <ThemedText style={styles.menuText}>알림 설정</ThemedText>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('도움말')}>
            <View style={styles.menuIcon}>
              <Ionicons name='help-circle' size={20} color='#E5C99C' />
            </View>
            <ThemedText style={styles.menuText}>도움말</ThemedText>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>
        </View>
      </View>

      {/* 계정 관리 섹션 */}
      <View style={styles.section}>
        <ThemedText type='title' style={styles.sectionTitle}>
          계정 관리
        </ThemedText>
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <View style={styles.menuIcon}>
              <Ionicons name='log-out' size={20} color='#FF6B6B' />
            </View>
            <ThemedText style={[styles.menuText, styles.dangerText]}>로그아웃</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <View style={styles.menuIcon}>
              <Ionicons name='trash' size={20} color='#FF6B6B' />
            </View>
            <ThemedText style={[styles.menuText, styles.dangerText]}>계정 삭제</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 앱 정보 */}
      <View style={styles.section}>
        <View style={styles.appInfo}>
          <ThemedText type='caption' style={styles.appInfoText}>
            골든레이스 v1.0.0
          </ThemedText>
          <ThemedText type='caption' style={styles.appInfoText}>
            © 2024 GoldenRace. All rights reserved.
          </ThemedText>
        </View>
      </View>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  sectionTitle: {
    color: '#E5C99C',
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(180, 138, 60, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B48A3C',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 12,
  },
  userStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#E5C99C',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#E5C99C',
    fontSize: 24,
    fontWeight: '600',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#B48A3C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  levelContainer: {
    gap: 12,
  },
  currentLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    backgroundColor: 'rgba(180, 138, 60, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    color: '#E5C99C',
    fontSize: 14,
    fontWeight: '600',
  },
  levelDescription: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 12,
  },
  levelProgress: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B48A3C',
    borderRadius: 3,
  },
  progressText: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 12,
    textAlign: 'center',
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  dangerText: {
    color: '#FF6B6B',
  },
  appInfo: {
    alignItems: 'center',
    gap: 4,
  },
  appInfoText: {
    color: '#FFFFFF',
    opacity: 0.5,
    fontSize: 12,
  },
});

export default MyPageScreen;
