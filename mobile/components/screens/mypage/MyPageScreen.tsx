import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthProvider';
import { useUserProfile } from '@/lib/hooks/useUsers';
import { UserProfile } from '@/lib/types/user';
import { showConfirmMessage } from '@/utils/alert';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

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
      <ThemedView style={styles.container}>
        <ThemedText>로딩 중...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) return null;

  const username = profile?.name || user.email?.split('@')[0] || '사용자';
  const email = profile?.email || user.email || '';

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type='title' style={styles.title}>
          마이페이지
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.profileSection}>
        <ThemedView style={styles.avatarContainer}>
          <ThemedView style={styles.avatar}>
            <ThemedText type='title' style={styles.avatarText}>
              {username.charAt(0).toUpperCase()}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedText type='subtitle' style={styles.username}>
          {username}
        </ThemedText>
        <ThemedText type='caption' style={styles.email}>
          {email}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <ThemedText type='default' style={styles.menuText}>
            프로필 편집
          </ThemedText>
          <ThemedText type='default' style={styles.menuArrow}>
            ›
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <ThemedText type='default' style={styles.menuText}>
            즐겨찾기
          </ThemedText>
          <ThemedText type='default' style={styles.menuArrow}>
            ›
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <ThemedText type='default' style={styles.menuText}>
            알림 설정
          </ThemedText>
          <ThemedText type='default' style={styles.menuArrow}>
            ›
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <ThemedText type='default' style={styles.menuText}>
            개인정보 처리방침
          </ThemedText>
          <ThemedText type='default' style={styles.menuArrow}>
            ›
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <ThemedText type='default' style={styles.menuText}>
            이용약관
          </ThemedText>
          <ThemedText type='default' style={styles.menuArrow}>
            ›
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.actionSection}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutButtonText}>로그아웃</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <ThemedText style={styles.deleteAccountButtonText}>계정 삭제</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.infoSection}>
        <ThemedText style={styles.infoText}>
          {profile?.email || user?.email || '이메일 없음'}
        </ThemedText>
        <ThemedText style={styles.versionText}>버전 1.0.0</ThemedText>
      </ThemedView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 138, 60, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
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
  email: {
    opacity: 0.7,
    fontSize: 14,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  signOutButton: {
    backgroundColor: '#B48A3C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteAccountButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  deleteAccountButtonText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  infoText: {
    opacity: 0.6,
    fontSize: 12,
    marginBottom: 8,
  },
  versionText: {
    opacity: 0.5,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileContent: {
    alignItems: 'center',
  },
  menuList: {
    // Menu list styles
  },
  accountButtons: {
    gap: 12,
  },
});

export default MyPageScreen;
