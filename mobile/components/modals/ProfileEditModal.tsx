import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthProvider';
import { GOLD_THEME } from '@/constants/theme';

interface ProfileEditModalProps {
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.name || '');
  const [bio, setBio] = useState('');

  const handleSave = () => {
    console.log('프로필 저장:', { username, bio });
    onClose();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 사용자 정보 표시 */}
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarContainer}>
            <Ionicons name='person-circle' size={80} color={GOLD_THEME.GOLD.MEDIUM} />
            <TouchableOpacity style={styles.avatarEditButton} activeOpacity={0.7}>
              <Ionicons name='camera' size={20} color={GOLD_THEME.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.emailText}>{user?.email}</ThemedText>
        </View>

        {/* 입력 필드들 */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name='person-outline' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='body' style={styles.label}>
                사용자명
              </ThemedText>
            </View>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder='사용자명을 입력하세요'
              placeholderTextColor={GOLD_THEME.TEXT.TERTIARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name='create-outline' size={16} color={GOLD_THEME.TEXT.SECONDARY} />
              <ThemedText type='body' style={styles.label}>
                자기소개
              </ThemedText>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder='자기소개를 입력하세요'
              placeholderTextColor={GOLD_THEME.TEXT.TERTIARY}
              multiline
              numberOfLines={4}
              textAlignVertical='top'
            />
          </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.PRIMARY,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarEditButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GOLD_THEME.BACKGROUND.PRIMARY,
  },
  emailText: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 14,
  },
  formContainer: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 15,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
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
