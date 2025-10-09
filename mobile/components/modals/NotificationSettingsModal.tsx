import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Switch, TouchableOpacity, View, ScrollView } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

interface NotificationSettingsModalProps {
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  onClose,
}) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [bettingAlerts, setBettingAlerts] = useState(true);
  const [raceResults, setRaceResults] = useState(true);
  const [promotions, setPromotions] = useState(false);

  const handleSave = () => {
    console.log('알림 설정 저장:', {
      pushNotifications,
      emailNotifications,
      bettingAlerts,
      raceResults,
      promotions,
    });
    onClose();
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
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={[styles.settingItem, value && styles.settingItemActive]}>
      <View style={styles.settingInfo}>
        <View style={[styles.iconContainer, value && styles.iconContainerActive]}>
          <Ionicons
            name={icon as any}
            size={22}
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 섹션 헤더 */}
      <View style={styles.sectionHeader}>
        <Ionicons name='notifications' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
        <ThemedText style={styles.sectionTitle}>알림 설정</ThemedText>
      </View>
      <ThemedText style={styles.sectionDescription}>받고 싶은 알림을 선택하세요</ThemedText>

      {/* 설정 항목들 */}
      <View style={styles.settingsContainer}>
        <SettingItem
          icon='notifications'
          title='푸시 알림'
          description='앱 푸시 알림을 받습니다'
          value={pushNotifications}
          onValueChange={setPushNotifications}
        />

        <SettingItem
          icon='mail'
          title='이메일 알림'
          description='이메일로 알림을 받습니다'
          value={emailNotifications}
          onValueChange={setEmailNotifications}
        />

        <SettingItem
          icon='alert-circle'
          title='베팅 알림'
          description='베팅 관련 알림을 받습니다'
          value={bettingAlerts}
          onValueChange={setBettingAlerts}
        />

        <SettingItem
          icon='trophy'
          title='경주 결과'
          description='경주 결과 알림을 받습니다'
          value={raceResults}
          onValueChange={setRaceResults}
        />

        <SettingItem
          icon='gift'
          title='프로모션'
          description='프로모션 알림을 받습니다'
          value={promotions}
          onValueChange={setPromotions}
        />
      </View>

      {/* 버튼 그룹 */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name='close-circle-outline' size={18} color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.cancelButtonText}>취소</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Ionicons name='checkmark-circle' size={18} color={GOLD_THEME.TEXT.PRIMARY} />
          <ThemedText style={styles.saveButtonText}>저장</ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDescription: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  settingsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 13,
    lineHeight: 18,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  cancelButtonText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    shadowColor: GOLD_THEME.GOLD.MEDIUM,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
});
