import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Switch, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [bettingAlerts, setBettingAlerts] = useState(true);
  const [raceResults, setRaceResults] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 설정 변경 시 즉시 서버에 저장
  const saveSettings = async (key: string, value: boolean) => {
    setIsSaving(true);
    try {
      // TODO: API 연동
      console.log('알림 설정 저장:', { [key]: value });
      // await notificationApi.updatePreferences({ [key]: value });
    } catch (error) {
      console.error('설정 저장 실패:', error);
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: string, currentValue: boolean, setter: (value: boolean) => void) => {
    const newValue = !currentValue;
    setter(newValue);
    saveSettings(key, newValue);
  };

  const SettingItem = ({
    icon,
    title,
    description,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    description: string;
    value: boolean;
    onValueChange: () => void;
  }) => (
    <View style={[styles.settingItem, value && styles.settingItemActive]}>
      <View style={styles.settingInfo}>
        <View style={[styles.iconContainer, value && styles.iconContainerActive]}>
          <Ionicons
            name={icon as any}
            size={24}
            color={value ? GOLD_THEME.TEXT.PRIMARY : GOLD_THEME.TEXT.TERTIARY}
          />
        </View>
        <View style={styles.settingText}>
          <ThemedText style={styles.settingLabel}>{title}</ThemedText>
          <ThemedText style={styles.settingDescription}>{description}</ThemedText>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={isSaving}
        trackColor={{
          false: GOLD_THEME.BACKGROUND.SECONDARY,
          true: GOLD_THEME.GOLD.DARK,
        }}
        thumbColor={value ? GOLD_THEME.GOLD.LIGHT : GOLD_THEME.TEXT.TERTIARY}
        ios_backgroundColor={GOLD_THEME.BACKGROUND.SECONDARY}
      />
    </View>
  );

  return (
    <PageLayout>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name='notifications' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            <ThemedText type='title' style={styles.title}>
              알림 설정
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.subtitle}>
            토글 시 자동으로 저장됩니다
          </ThemedText>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 설정 항목들 */}
        <View style={styles.settingsContainer}>
          <SettingItem
            icon='notifications'
            title='푸시 알림'
            description='앱 푸시 알림을 받습니다'
            value={pushNotifications}
            onValueChange={() =>
              handleToggle('pushNotifications', pushNotifications, setPushNotifications)
            }
          />

          <SettingItem
            icon='mail'
            title='이메일 알림'
            description='이메일로 알림을 받습니다'
            value={emailNotifications}
            onValueChange={() =>
              handleToggle('emailNotifications', emailNotifications, setEmailNotifications)
            }
          />

          <SettingItem
            icon='alert-circle'
            title='베팅 알림'
            description='베팅 관련 알림을 받습니다'
            value={bettingAlerts}
            onValueChange={() => handleToggle('bettingAlerts', bettingAlerts, setBettingAlerts)}
          />

          <SettingItem
            icon='trophy'
            title='경주 결과'
            description='경주 결과 알림을 받습니다'
            value={raceResults}
            onValueChange={() => handleToggle('raceResults', raceResults, setRaceResults)}
          />

          <SettingItem
            icon='gift'
            title='프로모션'
            description='프로모션 알림을 받습니다'
            value={promotions}
            onValueChange={() => handleToggle('promotions', promotions, setPromotions)}
          />
        </View>

        {/* 저장 상태 표시 */}
        {isSaving && (
          <View style={styles.savingIndicator}>
            <ThemedText style={styles.savingText}>저장 중...</ThemedText>
          </View>
        )}
      </ScrollView>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: GOLD_THEME.BORDER.GOLD,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: GOLD_THEME.TEXT.SECONDARY,
  },
  subtitle: {
    color: GOLD_THEME.TEXT.TERTIARY,
  },
  container: {
    flex: 1,
  },
  settingsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  settingItemActive: {
    borderColor: GOLD_THEME.BORDER.GOLD,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  iconContainerActive: {
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderColor: GOLD_THEME.GOLD.MEDIUM,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
    lineHeight: 20,
  },
  savingIndicator: {
    padding: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  savingText: {
    color: GOLD_THEME.GOLD.DARK,
    fontSize: 14,
    fontWeight: '600',
  },
});
