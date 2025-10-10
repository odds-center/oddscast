import { useAppTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter, usePathname } from 'expo-router';
import React from 'react';

export function CustomTabs() {
  const { colors, fonts } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = (tabName: string) => {
    const targetPath = `/(app)/${tabName}`;

    // 현재 경로가 해당 탭의 루트라면 이동하지 않음
    if (pathname === targetPath || pathname === `/(app)/${tabName}/`) {
      return;
    }

    // 탭을 누를 때마다 해당 탭의 루트로 이동
    router.push(targetPath);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        lazy: false, // 탭을 미리 로드하여 깜빡임 방지
        freezeOnBlur: false, // 탭을 벗어나도 화면 상태 유지
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 100,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <LinearGradient colors={colors.gradient.card as any} style={{ flex: 1 }} />
        ),
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 12,
          marginTop: 6,
          lineHeight: 18,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
        // 화면 전환 애니메이션 최적화
        animation: 'none', // 애니메이션 제거로 즉각적인 전환
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 28 : 24}
              name={focused ? 'home' : 'home-outline'}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => handleTabPress('home'),
        }}
      />
      <Tabs.Screen
        name='races'
        options={{
          title: '경주',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 28 : 24}
              name={focused ? 'trophy' : 'trophy-outline'}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => handleTabPress('races'),
        }}
      />
      <Tabs.Screen
        name='records'
        options={{
          title: '기록',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 28 : 24}
              name={focused ? 'document-text' : 'document-text-outline'}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => handleTabPress('records'),
        }}
      />

      <Tabs.Screen
        name='results'
        options={{
          title: '결과',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 28 : 24}
              name={focused ? 'analytics' : 'analytics-outline'}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => handleTabPress('results'),
        }}
      />
      <Tabs.Screen
        name='mypage'
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 28 : 24}
              name={focused ? 'person' : 'person-outline'}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => handleTabPress('mypage'),
        }}
      />
    </Tabs>
  );
}
