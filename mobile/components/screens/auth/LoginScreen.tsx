import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthProvider';
import { showUserErrorMessage, showUserSuccessMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google login...');

      // Google 로그인 실행
      await signIn();
      // 성공 시 자동으로 홈 화면으로 이동하므로 별도 메시지 불필요
    } catch (error: any) {
      console.error('Google login error:', error);
      const errorMessage = error?.message || 'Google 로그인이 실패했습니다.';
      showUserErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* 배경 그라데이션 */}
      <LinearGradient colors={['#0C2A1E', '#1A4A2E']} style={styles.backgroundGradient} />

      {/* 로고 및 제목 영역 */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Ionicons name='trophy' size={48} color='#E5C99C' />
        </View>
        <ThemedText type='largeTitle' lightColor='#B48A3C' darkColor='#E5C99C' style={styles.title}>
          GoldenRace
        </ThemedText>
        <ThemedText
          type='subtitle'
          lightColor='#687076'
          darkColor='#9BA1A6'
          style={styles.subtitle}
        >
          경마 앱에 오신 것을 환영합니다
        </ThemedText>
        <ThemedText type='body' lightColor='#687076' darkColor='#9BA1A6' style={styles.description}>
          최고의 경마 경험을 시작하세요
        </ThemedText>
      </View>

      {/* 로그인 버튼 영역 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.disabledButton]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Ionicons name='logo-google' size={24} color='#11181C' style={styles.googleIcon} />
          <ThemedText
            type='defaultSemiBold'
            lightColor='#11181C'
            darkColor='#FFFFFF'
            style={styles.googleButtonText}
          >
            {isLoading ? '로그인 중...' : 'Google 계정으로 로그인'}
          </ThemedText>
        </TouchableOpacity>

        <ThemedText
          type='caption'
          lightColor='#687076'
          darkColor='#9BA1A6'
          style={styles.termsText}
        >
          로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다
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
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 8,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    flex: 1,
    textAlign: 'center',
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.7,
  },
});
