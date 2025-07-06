import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={theme.colors.gradient.card as [string, string]}
            style={{ flex: 1 }}
          />
        ),
        tabBarLabelStyle: {
          fontFamily: theme.fonts.bold,
          fontSize: 12,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
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
    </Tabs>
  );
}
