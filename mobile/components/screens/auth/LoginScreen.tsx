import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthProvider';
import { showUserErrorMessage, showUserSuccessMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

export default function LoginScreen() {
  const { user, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google login...');

      // AuthProvider의 signIn 메서드 사용
      await signIn();
      showUserSuccessMessage('Google 로그인이 완료되었습니다.');
    } catch (error) {
      console.error('Google login error:', error);
      showUserErrorMessage('Google 로그인이 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* 로고 및 제목 영역 */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Ionicons name='trophy' size={48} color='#E5C99C' />
        </View>
        <ThemedText type='largeTitle' lightColor='#B48A3C' darkColor='#E5C99C' style={styles.title}>
          GoldenRace
        </ThemedText>
        <ThemedText type='subtitle' style={styles.subtitle}>
          경마 앱에 오신 것을 환영합니다
        </ThemedText>
      </View>

      {/* 버튼 섹션 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.disabledButton]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <View style={styles.googleButtonContent}>
            <Ionicons name='logo-google' size={20} color='#4285F4' style={styles.googleIcon} />
            <ThemedText style={styles.googleButtonText}>
              {isLoading ? '로그인 중...' : 'Google로 로그인'}
            </ThemedText>
          </View>
        </TouchableOpacity>

        <ThemedText style={styles.termsText}>
          로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B48A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonSection: {
    width: '100%',
    paddingBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C4043',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleIcon: {
    marginRight: 12,
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.7,
  },
});
