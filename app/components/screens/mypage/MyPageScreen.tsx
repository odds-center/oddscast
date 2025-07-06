import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function MyPageScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Page</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Manage your preferences and view your favorite races.</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    color: theme.colors.primary,
    marginBottom: theme.spacing.l,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.l,
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  cardText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.radii.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
    marginLeft: theme.spacing.m,
    fontSize: 16,
  },
});

