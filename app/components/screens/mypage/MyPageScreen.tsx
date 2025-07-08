import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';

type MyPageRoute =
  | '/mypage/profile'
  | '/mypage/history'
  | '/mypage/favorites'
  | '/mypage/notifications'
  | '/mypage/settings'
  | '/mypage/help';

type MenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: MyPageRoute;
};

interface Profile {
  username: string | null;
  email: string | null;
}

export default function MyPageScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (session) {
      getProfile();
    }
  }, [session]);

  async function getProfile() {
    try {
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', session.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('로그아웃 오류', error.message);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      title: '프로필 관리',
      subtitle: '개인정보 수정',
      icon: 'person-outline',
      color: theme.colors.primary,
      route: '/mypage/profile',
    },
    {
      id: 'history',
      title: '베팅 내역',
      subtitle: '나의 베팅 기록',
      icon: 'time-outline',
      color: theme.colors.accent,
      route: '/mypage/history',
    },
    {
      id: 'favorites',
      title: '즐겨찾기',
      subtitle: '관심 말 관리',
      icon: 'heart-outline',
      color: theme.colors.error,
      route: '/mypage/favorites',
    },
    {
      id: 'notifications',
      title: '알림 설정',
      subtitle: '푸시 알림 관리',
      icon: 'notifications-outline',
      color: theme.colors.success,
      route: '/mypage/notifications',
    },
    {
      id: 'settings',
      title: '설정',
      subtitle: '앱 설정',
      icon: 'settings-outline',
      color: theme.colors.textSecondary,
      route: '/mypage/settings',
    },
    {
      id: 'help',
      title: '고객센터',
      subtitle: '문의 및 도움말',
      icon: 'help-circle-outline',
      color: theme.colors.warning,
      route: '/mypage/help',
    },
  ];

  const stats = [
    { label: '총 베팅', value: '127회', icon: 'trending-up' },
    { label: '승률', value: '68%', icon: 'trophy' },
    { label: '수익률', value: '+23%', icon: 'wallet' },
  ];

  return (
    <LinearGradient
      colors={theme.colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text type='title' style={styles.title}>
              마이페이지
            </Text>
            <Text type='subtitle' style={styles.subtitle}>
              내 정보와 설정을 관리하세요
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/mypage/profile')}
          >
            <Ionicons name='create-outline' size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={theme.colors.gradient.card as [string, string]}
            style={styles.profileCard}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name='person' size={32} color={theme.colors.text} />
                </View>
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.profileInfo}>
                <Text type='defaultSemiBold' style={styles.userName}>
                  {profile?.username || '사용자'}
                </Text>
                <Text type='caption' style={styles.userEmail}>
                  {profile?.email || session?.user?.email || '이메일 없음'}
                </Text>
                <View style={styles.memberBadge}>
                  <Ionicons name='star' size={12} color={theme.colors.primary} />
                  <Text type='caption' style={styles.memberText}>
                    골드 멤버
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name={stat.icon as any} size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text type='stat' style={styles.statValue}>
                  {stat.value}
                </Text>
                <Text type='caption' style={styles.statLabel}>
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text type='defaultSemiBold' style={styles.sectionTitle}>
            메뉴
          </Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push(item.route)}
            >
              <LinearGradient
                colors={theme.colors.gradient.card as [string, string]}
                style={styles.menuCard}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={styles.menuContent}>
                  <Text type='defaultSemiBold' style={styles.menuTitle}>
                    {item.title}
                  </Text>
                  <Text type='caption' style={styles.menuSubtitle}>
                    {item.subtitle}
                  </Text>
                </View>
                <Ionicons name='chevron-forward' size={20} color={theme.colors.textSecondary} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <LinearGradient
              colors={[theme.colors.error, theme.colors.error + '80'] as [string, string]}
              style={styles.logoutGradient}
            >
              <Ionicons name='log-out-outline' size={20} color={theme.colors.text} />
              <Text type='defaultSemiBold' style={styles.logoutText}>
                로그아웃
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text type='caption' style={styles.appVersion}>
            Golden Race v1.0.0
          </Text>
          <Text type='caption' style={styles.appCopyright}>
            © 2025 Golden Race. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    // fontFamily: theme.fonts.heading, // Handled by ThemedText type
    // fontSize: 28, // Handled by ThemedText type
    // color: theme.colors.text, // Handled by ThemedText type
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    // fontFamily: theme.fonts.body, // Handled by ThemedText type
    // fontSize: 14, // Handled by ThemedText type
    // color: theme.colors.textSecondary, // Handled by ThemedText type
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
  },
  profileSection: {
    marginBottom: theme.spacing.l,
  },
  profileCard: {
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.m,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    marginBottom: theme.spacing.s,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.s,
    alignSelf: 'flex-start',
  },
  memberText: {
    marginLeft: theme.spacing.xs,
  },
  statsSection: {
    flexDirection: 'row',
    marginBottom: theme.spacing.l,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginRight: theme.spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.s,
  },
  statValue: {
    // Handled by ThemedText type
  },
  statLabel: {
    // Handled by ThemedText type
  },
  menuSection: {
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    marginBottom: theme.spacing.m,
  },
  menuItem: {
    marginBottom: theme.spacing.s,
  },
  menuCard: {
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    marginBottom: theme.spacing.xs,
  },
  menuSubtitle: {
    // Handled by ThemedText type
  },
  logoutSection: {
    marginBottom: theme.spacing.l,
  },
  logoutButton: {
    borderRadius: theme.radii.m,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
  },
  logoutText: {
    marginLeft: theme.spacing.s,
  },
  appInfoSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.l,
  },
  appVersion: {
    marginBottom: theme.spacing.xs,
  },
  appCopyright: {
    textAlign: 'center',
  },
});
