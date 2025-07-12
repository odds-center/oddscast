import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Alert, TouchableOpacity, View, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/context/AuthProvider'; // Updated import path
import { useAppTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText as Text } from '@/components/ThemedText';
import { Title, Subtitle } from '@/components/ui';

const { width, height } = Dimensions.get('window');

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn: authSignIn, session, loading } = useAuth();
  const { colors, spacing, radii, shadows, fonts } = useAppTheme();
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
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
      marginBottom: spacing.xl,
    },
    title: {
      marginBottom: spacing.s,
    },
    subtitle: {
      marginBottom: spacing.xl,
    },
    button: {
      width: '100%',
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: radii.m,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.s,
      ...shadows.medium,
    },
    buttonText: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text,
      marginLeft: spacing.s,
    },
    googleButton: {
      backgroundColor: '#DB4437', // Google Red
      flexDirection: 'row',
    },
  });

  return (
    <LinearGradient
      colors={colors.gradient.background as [string, string]}
      style={styles.container}
    >
      <StatusBar
        barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor='transparent'
        translucent
      />
      <View style={styles.content}>
        <Ionicons name='trophy' size={80} color={colors.primary} style={styles.logo} />
        <Title style={styles.title}>Golden Race</Title>
        <Subtitle style={styles.subtitle}>경마 예측의 새로운 기준</Subtitle>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={googleSignInLoading}
        >
          <Ionicons name='logo-google' size={20} color={colors.text} />
          <Text style={styles.buttonText}>Google로 로그인</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
