import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtleText,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name='races'
        options={{
          title: 'Races',
          tabBarIcon: ({ color }) => <Ionicons size={28} name='ios-list' color={color} />,
        }}
      />
      <Tabs.Screen
        name='results'
        options={{
          title: 'Results',
          tabBarIcon: ({ color }) => <Ionicons size={28} name='ios-stats-chart' color={color} />,
        }}
      />
      <Tabs.Screen
        name='mypage'
        options={{
          title: 'My Page',
          tabBarIcon: ({ color }) => <Ionicons size={28} name='ios-person' color={color} />,
        }}
      />
    </Tabs>
  );
}
