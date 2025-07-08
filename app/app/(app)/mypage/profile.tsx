import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';

export default function ProfileScreen() {
  const { session } = useAuth();
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

  return (
    <LinearGradient
      colors={theme.colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text type='title' style={styles.headerTitle}>
          프로필 관리
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text type='defaultSemiBold' style={styles.label}>
            이메일
          </Text>
          <TextInput
            style={styles.input}
            value={email || ''}
            editable={false} // Email is not editable
            placeholderTextColor={theme.colors.textTertiary}
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
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={updateProfile} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '저장 중...' : '프로필 저장'}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: theme.spacing.l,
  },
  inputGroup: {
    marginBottom: theme.spacing.m,
  },
  label: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.s,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    paddingHorizontal: theme.spacing.m,
    height: 50,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.m,
    paddingVertical: theme.spacing.m,
    alignItems: 'center',
    marginTop: theme.spacing.l,
  },
  buttonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
});
