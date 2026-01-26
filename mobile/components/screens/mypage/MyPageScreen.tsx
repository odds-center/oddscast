import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 디자인 시스템
import { StyledText, Section, StatCard, Card, SectionHeader } from '@/components/ui';
import { PageLayout } from '@/components/common';
import { Colors, Spacing } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthProvider';
import { useBetStatistics } from '@/lib/hooks/useBets';
import { useCurrentUserProfile } from '@/lib/hooks/useUsers';
import { showSuccessMessage, showErrorMessage, showInfoMessage } from '@/utils/alert';

const MyPageScreen = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // API 데이터 조회
  const { data: userProfile } = useCurrentUserProfile();
  const { data: betStats, isLoading: betStatsLoading } = useBetStatistics();

  const handleSignOut = async () => {
    try {
      await signOut();
      showSuccessMessage('로그아웃되었습니다');
      // 로그아웃 후 로그인 페이지로 이동
      router.replace('/login');
    } catch (error) {
      showErrorMessage('로그아웃 중 오류가 발생했습니다');
      console.error('로그아웃 에러:', error);
    }
  };

  const handleDeleteAccount = () => {
    showInfoMessage('계정 삭제 기능이 곧 추가될 예정입니다');
  };

  const handleMenuPress = (menuName: string) => {
    switch (menuName) {
      case '프로필 편집':
        router.push('/mypage/profile-edit');
        break;
      case '즐겨찾기':
        router.push('/mypage/favorites');
        break;
      case '알림 설정':
        router.push('/mypage/notification-settings');
        break;
      case '도움말':
        router.push('/mypage/help');
        break;
      default:
        showInfoMessage(`${menuName} 기능이 곧 추가될 예정입니다`);
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <View style={styles.centerContainer}>
          <StyledText variant='h3' style={styles.errorText}>
            로그인이 필요합니다.
          </StyledText>
        </View>
      </PageLayout>
    );
  }

  const username = userProfile?.name || user?.name || user?.email?.split('@')[0] || '사용자';
  const email = userProfile?.email || user?.email || '';

  return (
    <PageLayout>
      {/* 프로필 섹션 */}
      <Section>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name='person' size={32} color={Colors.text.primary} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <StyledText variant='h2' style={styles.username}>
              {username}
            </StyledText>
            <StyledText variant='body' color={Colors.text.tertiary} style={styles.email}>
              {email}
            </StyledText>
            <View style={styles.userStats}>
              <StatCard
                icon='document-text'
                label='베팅 기록'
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
          </View>
        </View>
      </Section>

      {/* 구독 관리 섹션 */}
      <Section>
        <SectionHeader title='구독' />
        <Card variant='base' style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/mypage/subscription/dashboard')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name='card' size={20} color={Colors.text.secondary} />
            </View>
            <StyledText style={styles.menuText}>구독 관리</StyledText>
            <Ionicons name='chevron-forward' size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/mypage/subscription/plans')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name='diamond' size={20} color={Colors.text.secondary} />
            </View>
            <StyledText style={styles.menuText}>프리미엄 구독</StyledText>
            <Ionicons name='chevron-forward' size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </Card>
      </Section>

      {/* 메뉴 섹션 */}
      <Section>
        <SectionHeader title='설정' />
        <Card variant='base' style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('프로필 편집')}>
            <View style={styles.menuIcon}>
              <Ionicons name='person' size={20} color={Colors.text.secondary} />
            </View>
            <StyledText style={styles.menuText}>프로필 편집</StyledText>
            <Ionicons name='chevron-forward' size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('즐겨찾기')}>
            <View style={styles.menuIcon}>
              <Ionicons name='heart' size={20} color={Colors.text.secondary} />
            </View>
            <StyledText style={styles.menuText}>즐겨찾기</StyledText>
            <Ionicons name='chevron-forward' size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('알림 설정')}>
            <View style={styles.menuIcon}>
              <Ionicons name='notifications' size={20} color={Colors.text.secondary} />
            </View>
            <StyledText style={styles.menuText}>알림 설정</StyledText>
            <Ionicons name='chevron-forward' size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('도움말')}>
            <View style={styles.menuIcon}>
              <Ionicons name='help-circle' size={20} color={Colors.text.secondary} />
            </View>
            <StyledText style={styles.menuText}>도움말</StyledText>
            <Ionicons name='chevron-forward' size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </Card>
      </Section>

      {/* 계정 관리 섹션 */}
      <Section>
        <SectionHeader title='계정 관리' />
        <Card variant='base' style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <View style={styles.menuIcon}>
              <Ionicons name='log-out' size={20} color={Colors.status.error} />
            </View>
            <StyledText style={[styles.menuText, styles.dangerText]}>로그아웃</StyledText>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <View style={styles.menuIcon}>
              <Ionicons name='trash' size={20} color={Colors.status.error} />
            </View>
            <StyledText style={[styles.menuText, styles.dangerText]}>계정 삭제</StyledText>
          </TouchableOpacity>
        </Card>
      </Section>

      {/* 앱 정보 */}
      <Section>
        <View style={styles.appInfo}>
          <StyledText variant='caption' color={Colors.text.tertiary}>
            골든레이스 v1.0.0
          </StyledText>
          <StyledText variant='caption' color={Colors.text.tertiary}>
            © 2024 GoldenRace. All rights reserved.
          </StyledText>
        </View>
      </Section>
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
    textAlign: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: Spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary.main}30`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary.dark,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    marginBottom: Spacing.xs,
  },
  email: {
    marginBottom: Spacing.md,
  },
  userStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  menuList: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  menuIcon: {
    marginRight: Spacing.md,
    width: 24,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    marginLeft: Spacing.lg + 34, // 아이콘 너비 + 마진 고려
  },
  dangerText: {
    color: Colors.status.error,
  },
  appInfo: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
});

export default MyPageScreen;
