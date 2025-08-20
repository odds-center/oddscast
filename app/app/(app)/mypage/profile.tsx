import { ThemedText as Text } from '@/components/ThemedText';
import { useAppTheme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '@/components/common';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { colors, spacing, radii, fonts, shadows } = useAppTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      getProfile();
    }
  }, [session]);

  async function getProfile() {
    try {
      if (!session?.user) return;

      // 간단한 프로필 정보 설정 (실제로는 API에서 가져와야 함)
      setUsername(session.user.email?.split('@')[0] || '사용자');
      setEmail(session.user.email || '');
    } catch (error: any) {
      console.error('프로필 가져오기 실패:', error);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      // 간단한 로컬 상태로 변경 (실제로는 API에 저장해야 함)
      console.log('프로필 업데이트:', { username, email });
      Alert.alert('프로필 업데이트 성공!');
    } catch (error: any) {
      console.error('프로필 업데이트 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.l,
    },
    inputGroup: {
      marginBottom: spacing.m,
    },
    label: {
      color: colors.textSecondary,
      marginBottom: spacing.s,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: radii.m,
      paddingHorizontal: spacing.m,
      height: 50,
      color: colors.text,
      fontFamily: fonts.body,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radii.m,
      paddingVertical: spacing.m,
      alignItems: 'center',
      marginTop: spacing.l,
    },
    buttonText: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
  });

  return (
    <LinearGradient
      colors={colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <PageHeader
        title='프로필 관리'
        subtitle='개인 정보를 관리하세요'
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text type='defaultSemiBold' style={styles.label}>
            이메일
          </Text>
          <TextInput
            style={styles.input}
            value={email || ''}
            editable={false} // Email is not editable
            placeholderTextColor={colors.text}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text type='defaultSemiBold' style={styles.label}>
            사용자 이름
          </Text>
          <TextInput
            style={styles.input}
            value={username || ''}
            onChangeText={setUsername}
            placeholder='사용자 이름을 입력하세요'
            placeholderTextColor={colors.text}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={updateProfile} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '저장 중...' : '프로필 저장'}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
