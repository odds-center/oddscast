import { PageLayout } from '@/components/common/PageLayout';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.name || '');
  const [bio, setBio] = useState('');

  const handleSave = () => {
    console.log('프로필 저장:', { username, bio });
    Alert.alert('저장 완료', '프로필이 성공적으로 저장되었습니다.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel} activeOpacity={0.7}>
          <Ionicons name='arrow-back' size={24} color={GOLD_THEME.TEXT.SECONDARY} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name='person-circle' size={24} color={GOLD_THEME.GOLD.MEDIUM} />
            <ThemedText type='title' style={styles.title}>
              프로필 편집
            </ThemedText>
          </View>
          <ThemedText type='caption' style={styles.subtitle}>
            프로필 정보를 수정하세요
          </ThemedText>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 사용자 정보 표시 */}
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarContainer}>
            <Ionicons name='person-circle' size={100} color={GOLD_THEME.GOLD.MEDIUM} />
            <TouchableOpacity style={styles.avatarEditButton} activeOpacity={0.7}>
              <Ionicons name='camera' size={24} color={GOLD_THEME.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.emailText}>{user?.email}</ThemedText>
        </View>

        {/* 입력 필드들 */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name='person-outline' size={18} color={GOLD_THEME.TEXT.SECONDARY} />
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
              <Ionicons name='create-outline' size={18} color={GOLD_THEME.TEXT.SECONDARY} />
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
              numberOfLines={5}
              textAlignVertical='top'
            />
          </View>
        </View>

        {/* 버튼 그룹 */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.7}>
            <Ionicons name='close-circle-outline' size={20} color={GOLD_THEME.TEXT.SECONDARY} />
            <ThemedText style={styles.cancelButtonText}>취소</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
            <Ionicons name='checkmark-circle' size={20} color={GOLD_THEME.TEXT.PRIMARY} />
            <ThemedText style={styles.saveButtonText}>저장</ThemedText>
          </TouchableOpacity>
        </View>
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
  userInfoContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_THEME.BORDER.PRIMARY,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarEditButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: GOLD_THEME.BACKGROUND.PRIMARY,
  },
  emailText: {
    color: GOLD_THEME.TEXT.TERTIARY,
    fontSize: 16,
  },
  formContainer: {
    gap: 24,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: GOLD_THEME.TEXT.PRIMARY,
    fontSize: 16,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.GOLD,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: GOLD_THEME.BACKGROUND.SECONDARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_THEME.BORDER.PRIMARY,
  },
  cancelButtonText: {
    color: GOLD_THEME.TEXT.SECONDARY,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: GOLD_THEME.GOLD.DARK,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
    fontSize: 16,
    fontWeight: '700',
  },
});
