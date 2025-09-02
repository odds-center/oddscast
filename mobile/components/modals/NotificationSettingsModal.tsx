import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

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
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon as any} size={20} color='#E5C99C' />
        <View style={styles.settingText}>
          <ThemedText style={styles.settingLabel}>{title}</ThemedText>
          <ThemedText style={styles.settingDescription}>{description}</ThemedText>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#B48A3C' }}
        thumbColor={value ? '#E5C99C' : '#FFFFFF'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
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

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <ThemedText style={styles.cancelButtonText}>취소</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name='save' size={16} color='#FFFFFF' />
          <ThemedText style={styles.saveButtonText}>저장</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.2)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#B48A3C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
