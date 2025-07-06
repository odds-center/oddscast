import React from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Alert, TouchableOpacity, ImageBackground, View, Text } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn: authSignIn } = useAuth();

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
    });
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      await authSignIn(userInfo?.data.idToken!);
      router.replace('/(app)/races');
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Login Error', error.message);
      }
    }
  };

  return (
    <ImageBackground source={require('@/assets/images/background.png')} style={styles.background}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>Golden Race</Text>
        <Text style={styles.subtitle}>The ultimate horse racing experience.</Text>
        <TouchableOpacity style={styles.googleButton} onPress={signIn}>
          <Ionicons name='logo-google' size={24} color={theme.colors.text} />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 48,
    color: theme.colors.primary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.radii.l,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.m,
    fontSize: 16,
  },
});
