import { ThemedText as Text } from '@/components/ThemedText';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { PageLayout } from '@/components/common/PageLayout';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

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
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='#E5C99C' />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text type='title' style={styles.title}>
            프로필 관리
          </Text>
          <Text type='caption' style={styles.subtitle}>
            개인 정보를 관리하세요
          </Text>
        </View>
      </View>

      {/* 프로필 폼 */}
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text type='body' style={styles.label}>
            이메일
          </Text>
          <TextInput
            style={styles.input}
            value={email || ''}
            editable={false}
            placeholderTextColor='#999'
          />
        </View>

        <View style={styles.inputGroup}>
          <Text type='body' style={styles.label}>
            사용자 이름
          </Text>
          <TextInput
            style={styles.input}
            value={username || ''}
            onChangeText={setUsername}
            placeholder='사용자 이름을 입력하세요'
            placeholderTextColor='#999'
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={updateProfile} disabled={loading}>
          <Ionicons name='save' size={20} color='#FFFFFF' />
          <Text style={styles.buttonText}>{loading ? '저장 중...' : '프로필 저장'}</Text>
        </TouchableOpacity>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: '#E5C99C',
    marginBottom: 4,
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  section: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 138, 60, 0.3)',
  },
  button: {
    backgroundColor: '#B48A3C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
