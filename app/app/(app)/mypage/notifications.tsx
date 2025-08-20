import { PageHeader } from '@/components/common';
import { ThemedText as Text } from '@/components/ThemedText';
import { useAppTheme } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

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
      // 간단한 로컬 상태로 변경 (실제로는 API에서 가져와야 함)
      setNotificationsEnabled(false);
    } catch (error: any) {
      console.error('알림 설정 불러오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSetting = async (newValue: boolean) => {
    try {
      setNotificationsEnabled(newValue);
      // 간단한 로컬 상태로 변경 (실제로는 API에 저장해야 함)
      console.log('알림 설정 업데이트:', newValue);
    } catch (error: any) {
      console.error('알림 설정 업데이트 오류:', error);
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
        title='알림 설정'
        subtitle='푸시 알림을 관리하세요'
        showBackButton={true}
        onBackPress={() => {}}
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
