import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthProvider';
import { showUserErrorMessage, showUserSuccessMessage } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google login...');

      // AuthProvider의 signIn 메서드 사용
      const result = await signIn();

      // 신규 사용자와 기존 사용자 구분하여 메시지 표시
      if (result.isNewUser) {
        showUserSuccessMessage('🎉 환영합니다! 회원가입이 완료되었습니다. 🏇');
      } else {
        showUserSuccessMessage('환영합니다! 로그인이 완료되었습니다. 🏇');
      }

      // user 상태가 업데이트되면 _layout.tsx에서 자동으로 (app) 화면으로 리다이렉트됨
    } catch (error) {
      console.error('Google login error:', error);

      // 에러 메시지 개선
      const errorMessage = error instanceof Error ? error.message : 'Google 로그인에 실패했습니다.';

      showUserErrorMessage(
        errorMessage.includes('취소') ? '로그인이 취소되었습니다.' : `로그인 실패: ${errorMessage}`
      );
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
          AI 기반 경마 예측 게임
        </ThemedText>
        <ThemedText type='caption' style={styles.description}>
          데이터와 AI로 배우는 스마트한 예측
        </ThemedText>
      </View>

      {/* 버튼 섹션 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.disabledButton]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.googleButtonContent}>
            <View style={styles.googleIconContainer}>
              <Ionicons name='logo-google' size={20} color='#4285F4' />
            </View>
            <ThemedText style={styles.googleButtonText}>
              {isLoading ? '로그인 중...' : 'Google로 로그인'}
            </ThemedText>
          </View>
        </TouchableOpacity>

        <View style={styles.legalNotice}>
          <Ionicons name='information-circle-outline' size={16} color='#888' />
          <ThemedText style={styles.termsText}>
            본 서비스는 AI 예측 게임으로,{'\n'}
            포인트는 게임 내 가상 화폐입니다
          </ThemedText>
        </View>
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  description: {
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 32,
    fontSize: 14,
    textAlign: 'center',
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
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C4043',
    letterSpacing: 0.25,
  },
  disabledButton: {
    opacity: 0.6,
  },
  legalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  termsText: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
});
