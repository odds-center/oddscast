import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';

interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push('/notifications');
  };

  if (count === 0) {
    return (
      <TouchableOpacity onPress={handlePress} style={styles.container}>
        <ThemedText style={styles.icon}>🔔</ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <ThemedText style={styles.icon}>🔔</ThemedText>
      <View style={styles.badge}>
        <ThemedText type='caption' style={styles.badgeText}>
          {count > 99 ? '99+' : count.toString()}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
