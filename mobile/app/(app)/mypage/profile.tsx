import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

// 디자인 시스템
import { ThemedText } from '@/components/ThemedText';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLayout } from '@/components/common/PageLayout';
import { Button, Card, Section } from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthProvider';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getProfile() {
      try {
        if (!user) return;
        // 간단한 프로필 정보 설정 (실제로는 API에서 가져와야 함)
        setUsername(user.email?.split('@')[0] || '사용자');
        setEmail(user.email || '');
      } catch (error: any) {
        console.error('프로필 가져오기 실패:', error);
      }
    }

    if (user) {
      getProfile();
    }
  }, [user]);

  async function updateProfile() {
    try {
      setLoading(true);
      // 간단한 로컬 상태로 변경 (실제로는 API에 저장해야 함)
      console.log('프로필 업데이트:', { username, email });
      console.log('프로필 업데이트 성공!');
    } catch (error: any) {
      console.error('프로필 업데이트 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <PageHeader title='프로필 관리' subtitle='개인 정보를 관리하세요' showBackButton />

      {/* 프로필 폼 */}
      <Section>
        <Card variant='base'>
          <View style={styles.inputGroup}>
            <ThemedText type='caption' style={styles.label}>
              이메일
            </ThemedText>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email || ''}
              editable={false}
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type='caption' style={styles.label}>
              사용자 이름
            </ThemedText>
            <TextInput
              style={styles.input}
              value={username || ''}
              onChangeText={setUsername}
              placeholder='사용자 이름을 입력하세요'
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>

          <Button
            title={loading ? '저장 중...' : '프로필 저장'}
            onPress={updateProfile}
            disabled={loading}
            loading={loading}
            icon='save'
            fullWidth
            style={{ marginTop: Spacing.md }}
          />
        </Card>
      </Section>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 50,
    color: Colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: `${Colors.background.secondary}80`,
  },
});
