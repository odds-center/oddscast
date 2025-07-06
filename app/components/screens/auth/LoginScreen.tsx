import React from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Alert,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn: authSignIn, hasStoredToken, autoSignIn } = useAuth();

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
    });
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo?.data?.idToken) {
        await authSignIn(userInfo.data.idToken);
      } else {
        throw new Error('Failed to get ID token from Google Sign-In');
      }
      router.replace('/(app)/races');
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Login Error', error.message);
      }
    }
  };

  const handleAutoSignIn = async () => {
    try {
      const success = await autoSignIn();
      if (success) {
        router.replace('/(app)/races');
      } else {
        Alert.alert('Auto Sign-In Failed', 'Please sign in manually.');
      }
    } catch (error: any) {
      Alert.alert('Auto Sign-In Error', error.message);
    }
  };

  return (
    <LinearGradient
      colors={theme.colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />
      </View>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name='trophy' size={48} color={theme.colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>Golden Race</Text>
        <Text style={styles.subtitle}>최고의 경마 경험을 만나보세요</Text>
      </View>
      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name='analytics' size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText}>실시간 경마 정보</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name='trending-up' size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText}>정확한 예측 분석</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name='notifications' size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText}>실시간 알림</Text>
          </View>
        </View>
        {/* Login Buttons */}
        <View style={styles.buttonContainer}>
          {hasStoredToken && (
            <TouchableOpacity style={styles.autoSignInButton} onPress={handleAutoSignIn}>
              <LinearGradient
                colors={theme.colors.gradient.primary as [string, string]}
                style={styles.autoSignInGradient}
              >
                <Ionicons name='refresh' size={20} color={theme.colors.text} />
                <Text style={styles.autoSignInText}>자동 로그인</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.googleButton} onPress={signIn}>
            <View style={styles.googleButtonContent}>
              <Ionicons name='logo-google' size={24} color={theme.colors.text} />
              <Text style={styles.googleButtonText}>Google로 로그인</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          계속 진행하면 서비스 이용약관에 동의하는 것으로 간주됩니다
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: 'absolute',
    top: height * 0.1,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '20',
  },
  patternCircle2: {
    position: 'absolute',
    top: height * 0.3,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.accent + '20',
  },
  patternCircle3: {
    position: 'absolute',
    bottom: height * 0.2,
    right: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.secondary + '20',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    marginTop: 40,
    marginBottom: 0,
  },
  logoContainer: {
    marginBottom: theme.spacing.l,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.large,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 36,
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
    justifyContent: 'flex-start',
    marginTop: 0,
  },
  featuresContainer: {
    marginBottom: theme.spacing.xl,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  featureText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: theme.spacing.xl,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  autoSignInButton: {
    borderRadius: theme.radii.l,
    overflow: 'hidden',
    ...theme.shadows.medium,
    marginBottom: theme.spacing.m,
  },
  autoSignInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
  },
  autoSignInText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.s,
    letterSpacing: 0.5,
  },
  googleButton: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
    marginBottom: 0,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
  },
  googleButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.s,
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
    marginTop: 0,
  },
  footerText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
