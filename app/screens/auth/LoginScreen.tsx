import React from 'react';
import { StyleSheet, Button, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  React.useEffect(() => {
    GoogleSignin.configure({
      // webClientId is required for offline access
      webClientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com', // Replace with your actual web client ID
      // You can add more configuration options here if needed
    });
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      // You can now use userInfo to access user data and tokens
      Alert.alert('로그인 성공', `환영합니다, ${userInfo.user.name}님`);
      // TODO: Navigate to the main app screen
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        Alert.alert('로그인 취소', '로그인 과정이 사용자에 의해 취소되었습니다.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        Alert.alert('로그인 진행 중', '로그인 절차가 이미 진행 중입니다.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        Alert.alert('오류', 'Google Play 서비스를 사용할 수 없거나 버전이 낮습니다.');
      } else {
        // some other error happened
        Alert.alert('로그인 오류', error.toString());
        console.error(error);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type='title' style={styles.title}>
        경마 예측 앱
      </ThemedText>
      <Button title='Google로 로그인' onPress={signIn} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    marginBottom: 48,
  },
});
