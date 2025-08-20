import { PageHeader } from '@/components/common';
import { ThemedText as Text } from '@/components/ThemedText';
import { useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
  const { colors, spacing, radii, shadows, fonts } = useAppTheme();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (session) {
      getProfile();
    }
  }, [session]);

  async function getProfile() {
    try {
      if (!session?.user) return;

      // 간단한 프로필 정보 설정 (실제로는 API에서 가져와야 함)
      setProfile({
        username: session.user.email?.split('@')[0] || '사용자',
        email: session.user.email || '',
      });
    } catch (error: any) {
      console.error('프로필 가져오기 실패:', error);
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
      color: colors.primary,
      route: '/mypage/profile',
    },
    {
      id: 'history',
      title: '베팅 내역',
      subtitle: '나의 베팅 기록',
      icon: 'time-outline',
      color: colors.accent,
      route: '/mypage/history',
    },
    {
      id: 'favorites',
      title: '즐겨찾기',
      subtitle: '관심 말 관리',
      icon: 'heart-outline',
      color: colors.error,
      route: '/mypage/favorites',
    },
    {
      id: 'notifications',
      title: '알림 설정',
      subtitle: '푸시 알림 관리',
      icon: 'notifications-outline',
      color: colors.success,
      route: '/mypage/notifications',
    },
    {
      id: 'settings',
      title: '설정',
      subtitle: '앱 설정',
      icon: 'settings-outline',
      color: colors.textSecondary,
      route: '/mypage/settings',
    },
    {
      id: 'help',
      title: '고객센터',
      subtitle: '문의 및 도움말',
      icon: 'help-circle-outline',
      color: colors.warning,
      route: '/mypage/help',
    },
  ];

  const stats = [
    { label: '총 베팅', value: '127회', icon: 'trending-up' },
    { label: '승률', value: '68%', icon: 'trophy' },
    { label: '수익률', value: '+23%', icon: 'wallet' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.m,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    editButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.small,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: spacing.l,
      paddingBottom: spacing.xl,
    },
    profileSection: {
      marginBottom: spacing.l,
    },
    profileCard: {
      borderRadius: radii.l,
      padding: spacing.m,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.medium,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarContainer: {
      position: 'relative',
      marginRight: spacing.m,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.cardSecondary,
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
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.card,
    },
    profileInfo: {
      flex: 1,
    },
    userName: {
      marginBottom: spacing.xs,
    },
    userEmail: {
      marginBottom: spacing.s,
    },
    memberBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.xs,
      borderRadius: radii.s,
      alignSelf: 'flex-start',
    },
    memberText: {
      marginLeft: spacing.xs,
    },
    statsSection: {
      flexDirection: 'row',
      marginBottom: spacing.l,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      marginRight: spacing.s,
      flexDirection: 'row',
      alignItems: 'center',
      ...shadows.small,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.s,
    },
    statValue: {
      // Handled by ThemedText type
    },
    statLabel: {
      // Handled by ThemedText type
    },
    menuSection: {
      marginBottom: spacing.l,
    },
    sectionTitle: {
      marginBottom: spacing.m,
    },
    menuItem: {
      marginBottom: spacing.s,
    },
    menuCard: {
      borderRadius: radii.m,
      padding: spacing.m,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      ...shadows.small,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    menuContent: {
      flex: 1,
      justifyContent: 'center',
    },
    menuTitle: {
      marginBottom: spacing.xs,
    },
    menuSubtitle: {
      // Handled by ThemedText type
    },
    logoutSection: {
      marginBottom: spacing.l,
    },
    logoutButton: {
      borderRadius: radii.m,
      overflow: 'hidden',
      ...shadows.medium,
    },
    logoutGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.l,
    },
    logoutText: {
      marginLeft: spacing.s,
    },
    appInfoSection: {
      alignItems: 'center',
      paddingTop: spacing.l,
    },
    appVersion: {
      marginBottom: spacing.xs,
    },
    appCopyright: {
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <PageHeader
        title='마이페이지'
        subtitle='내 정보와 설정을 관리하세요'
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/mypage/profile')}
          >
            <Ionicons name='create-outline' size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={colors.gradient.card as [string, string]}
            style={styles.profileCard}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name='person' size={32} color={colors.text} />
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
                  <Ionicons name='star' size={12} color={colors.primary} />
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
                <Ionicons name={stat.icon as any} size={20} color={colors.primary} />
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
                colors={colors.gradient.card as [string, string]}
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
                <Ionicons name='chevron-forward' size={20} color={colors.textSecondary} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <LinearGradient
              colors={[colors.error, colors.error + '80'] as [string, string]}
              style={styles.logoutGradient}
            >
              <Ionicons name='log-out-outline' size={20} color={colors.text} />
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
    </View>
  );
}
