import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../../context';

const LoginScreen = () => {
  const { signIn, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn();
      Alert.alert('성공', 'Google 로그인이 완료되었습니다.');
    } catch (error: any) {
      if (error?.type === 'cancelled' || error?.code === 'cancelled') {
        // 사용자가 취소함
        return;
      }
      console.error('Google 로그인 실패:', error);
      Alert.alert('오류', 'Google 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GoldenRace</Text>
      <Text style={styles.subtitle}>경마 앱에 오신 것을 환영합니다</Text>

      <TouchableOpacity
        style={[styles.googleButton, (loading || isLoading) && styles.disabledButton]}
        onPress={handleGoogleLogin}
        disabled={loading || isLoading}
      >
        <Text style={styles.googleButtonText}>
          {loading || isLoading ? '로그인 중...' : 'Google 계정으로 로그인'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0C2A1E',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E5C99C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 48,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 250,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default LoginScreen;
