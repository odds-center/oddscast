import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useUserProfile } from '@/lib/hooks/useUsers';
import { UserProfile } from '@/lib/types/user';
import { showConfirmMessage } from '@/utils/alert';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout, Section, Button } from '@/components/common';

const MyPageScreen = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile(user?.id || '');

  useEffect(() => {
    if (user) {
      console.log('User authenticated:', user.email);
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [userProfile]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleDeleteAccount = () => {
    showConfirmMessage(
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      '계정 삭제',
      () => {
        // 계정 삭제 로직
        console.log('Delete account');
      },
      () => {
        console.log('계정 삭제 취소됨');
      }
    );
  };

  if (profileLoading) {
    return (
      <PageLayout showHeader={false}>
        <View style={styles.loadingContainer}>
          <ThemedText type='body'>로딩 중...</ThemedText>
        </View>
      </PageLayout>
    );
  }

  if (!user) return null;

  const username = profile?.name || user.email?.split('@')[0] || '사용자';
  const email = profile?.email || user.email || '';

  return (
    <PageLayout title='마이페이지' subtitle='내 정보와 설정을 관리하세요'>
      {/* 프로필 섹션 */}
      <Section variant='elevated'>
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ThemedText type='largeTitle' style={styles.avatarText}>
                {username.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <ThemedText type='title' style={styles.username}>
            {username}
          </ThemedText>
          <ThemedText type='body' lightColor='#687076' darkColor='#9BA1A6'>
            {email}
          </ThemedText>
        </View>
      </Section>

      {/* 메뉴 섹션 */}
      <Section variant='elevated'>
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem}>
            <ThemedText type='body' style={styles.menuText}>
              프로필 편집
            </ThemedText>
            <ThemedText type='body' style={styles.menuArrow}>
              ›
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <ThemedText type='body' style={styles.menuText}>
              즐겨찾기
            </ThemedText>
            <ThemedText type='body' style={styles.menuArrow}>
              ›
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <ThemedText type='body' style={styles.menuText}>
              알림 설정
            </ThemedText>
            <ThemedText type='body' style={styles.menuArrow}>
              ›
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <ThemedText type='body' style={styles.menuText}>
              개인정보 처리방침
            </ThemedText>
            <ThemedText type='body' style={styles.menuArrow}>
              ›
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <ThemedText type='body' style={styles.menuText}>
              이용약관
            </ThemedText>
            <ThemedText type='body' style={styles.menuArrow}>
              ›
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <ThemedText type='body' style={styles.menuText}>
              고객센터
            </ThemedText>
            <ThemedText type='body' style={styles.menuArrow}>
              ›
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <ThemedText type='body' style={styles.menuText}>
              앱 버전
            </ThemedText>
            <ThemedText type='body' style={styles.menuArrow}>
              1.0.0
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Section>

      {/* 계정 관리 섹션 */}
      <Section title='계정 관리' variant='outlined'>
        <View style={styles.accountButtons}>
          <Button
            title='로그아웃'
            onPress={handleSignOut}
            variant='danger'
            size='large'
            fullWidth
          />
          <Button
            title='계정 삭제'
            onPress={handleDeleteAccount}
            variant='danger'
            size='large'
            fullWidth
          />
        </View>
      </Section>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B48A3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B48A3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  username: {
    marginBottom: 8,
    opacity: 0.9,
  },
  menuList: {
    // Menu list styles
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 138, 60, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
    borderRadius: 8,
  },
  menuText: {
    opacity: 0.9,
    flex: 1,
  },
  menuArrow: {
    opacity: 0.6,
    marginLeft: 16,
  },
  accountButtons: {
    gap: 12,
  },
});

export default MyPageScreen;
