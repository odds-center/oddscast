import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Alert, TouchableOpacity, View, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/context/AuthProvider'; // Updated import path
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText as Text } from '@/components/ThemedText';

const { width, height } = Dimensions.get('window');

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn: authSignIn, session, loading } = useAuth();
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  useEffect(() => {
    if (!loading && session) {
      router.replace('/(app)/races');
    }
  }, [session, loading]);

  const handleGoogleSignIn = async () => {
    setGoogleSignInLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.idToken) {
        await authSignIn(userInfo.data.idToken);
      } else {
        throw new Error('Failed to get ID token from Google Sign-In');
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('로그인 오류', error.message);
      }
    } finally {
      setGoogleSignInLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={theme.colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />
      <View style={styles.content}>
        <Ionicons name='trophy' size={80} color={theme.colors.primary} style={styles.logo} />
        <Text type='title' style={[styles.title, { color: theme.colors.text }]}>
          Golden Race
        </Text>
        <Text type='subtitle' style={[styles.subtitle, { color: theme.colors.text }]}>
          경마 예측의 새로운 기준
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={googleSignInLoading}
        >
          <Ionicons name='logo-google' size={20} color={theme.colors.text} />
          <Text style={styles.buttonText}>Google로 로그인</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    alignItems: 'center',
  },
  logo: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    marginBottom: theme.spacing.xl,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.s,
    ...theme.shadows.medium,
  },
  buttonText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.s,
  },
  googleButton: {
    backgroundColor: '#DB4437', // Google Red
    flexDirection: 'row',
  },
});
