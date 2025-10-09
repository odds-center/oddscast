import { useAppTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';

export function CustomTabs() {
  const { colors, fonts } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
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
      />
      <Tabs.Screen
        name='betting'
        options={{
          title: '베팅',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 28 : 24}
              name={focused ? 'game-controller' : 'game-controller-outline'}
              color={color}
            />
          ),
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
      />
      <Tabs.Screen name='races/[raceId]' options={{ href: null }} />
      <Tabs.Screen name='ranking' options={{ href: null }} />
      <Tabs.Screen name='betting/register' options={{ href: null }} />
    </Tabs>
  );
}
