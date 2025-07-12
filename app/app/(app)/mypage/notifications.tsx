import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import { PageHeader } from '@/components/common';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';

export default function NotificationSettingsScreen() {
  const { session } = useAuth();
  const { colors, spacing, radii, fonts } = useAppTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchNotificationSetting();
    }
  }, [session]);

  const fetchNotificationSetting = async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select('notifications_enabled')
        .eq('id', session.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setNotificationsEnabled(data.notifications_enabled);
      }
    } catch (error: any) {
      Alert.alert('알림 설정 불러오기 오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSetting = async (newValue: boolean) => {
    try {
      setNotificationsEnabled(newValue);
      if (!session?.user) throw new Error('No user on the session!');

      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: newValue })
        .eq('id', session.user.id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      Alert.alert('알림 설정 업데이트 오류', error.message);
      setNotificationsEnabled(!newValue); // Revert on error
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    section: { padding: spacing.l },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radii.m,
      padding: spacing.m,
      marginBottom: spacing.s,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 16,
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>설정 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="알림 설정"
        subtitle="푸시 알림을 관리하세요"
        showNotificationButton={false}
      />
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>푸시 알림</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={updateNotificationSetting}
            thumbColor={notificationsEnabled ? colors.primary : colors.border}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
          />
        </View>
      </View>
    </View>
  );
}
