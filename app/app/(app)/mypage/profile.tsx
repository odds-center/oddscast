import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Title } from '@/components/ui';
import { PageHeader } from '@/components/common';
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
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', session.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setEmail(data.email);
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session.user.id,
        username,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      Alert.alert('프로필 업데이트 성공!');
    } catch (error: any) {
      Alert.alert(error.message);
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
        title="프로필 관리"
        subtitle="개인 정보를 관리하세요"
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
