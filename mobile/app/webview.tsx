import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// WebApp URL — dev: 로컬, prod: EXPO_PUBLIC_WEBAPP_URL 또는 기본 Vercel
const WEBAPP_URL =
  __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000'
    : (process.env.EXPO_PUBLIC_WEBAPP_URL as string | undefined) || 'https://gold-race-webapp.vercel.app';

// API URL — 푸시 등록용
const API_BASE =
  __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:3001/api'
      : 'http://localhost:3001/api'
    : (Constants.expoConfig?.extra?.apiBaseUrl as string) || '';

const webClientId =
  Constants.expoConfig?.extra?.webClientId as string | undefined;

if (webClientId) {
  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
  });
}

// Foreground에서도 알림 표시 (app.json 설정과 동일)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function WebAppScreen() {
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();
  const { initialUrl } = useLocalSearchParams<{ initialUrl?: string }>();
  const initialUri =
    initialUrl && initialUrl.trim()
      ? initialUrl.startsWith('http')
        ? initialUrl.trim()
        : `${WEBAPP_URL}${initialUrl.startsWith('/') ? '' : '/'}${initialUrl.trim()}`
      : WEBAPP_URL;
  const [canGoBack, setCanGoBack] = useState(false);
  const expoPushTokenRef = useRef<string | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const hasRegisteredRef = useRef(false);

  const tryRegisterPush = async () => {
    const expoToken = expoPushTokenRef.current;
    const accessToken = authTokenRef.current;
    if (!expoToken || !accessToken || !API_BASE || hasRegisteredRef.current) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/push-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token: expoToken,
          deviceId: Device.modelName ?? undefined,
        }),
      });
      if (res.ok) hasRegisteredRef.current = true;
    } catch (e) {
      console.warn('Push subscribe failed', e);
    }
  };

  useEffect(() => {
    if (!Device.isDevice) return;
    (async () => {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let final = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        final = status;
      }
      if (final !== 'granted') return;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId as string,
      });
      expoPushTokenRef.current = tokenData.data;
      tryRegisterPush();
    })();
  }, []);

  const onNavStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack ?? false);
  };

  const handleBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    } else {
      router.back();
    }
  };

  const sendToWeb = (type: string, payload?: unknown) => {
    const script = `
      window.postMessage(JSON.stringify({
        type: '${type}',
        payload: ${JSON.stringify(payload || {})}
      }), '*');
      if (window.onNativeMessage) {
        window.onNativeMessage({
          type: '${type}',
          payload: ${JSON.stringify(payload || {})}
        });
      }
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type: string; payload?: { token?: string } };

      switch (data.type) {
        case 'LOGIN_GOOGLE':
          await handleGoogleLogin();
          break;
        case 'AUTH_READY':
          if (data.payload?.token) {
            authTokenRef.current = data.payload.token;
            tryRegisterPush();
          }
          break;
        case 'AUTH_LOGOUT':
          authTokenRef.current = null;
          break;
        case 'ECHO':
          sendToWeb('ECHO_REPLY', data.payload);
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to parse message from WebView', msg);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const token = userInfo.data?.idToken;

      if (token) {
        sendToWeb('LOGIN_SUCCESS', { token });
      }
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : undefined;
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        // cancelled
      } else {
        const msg = err instanceof Error ? err.message : 'Login failed';
        sendToWeb('LOGIN_FAILURE', { error: msg });
      }
    }
  };

  const reload = () => {
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.iconButton}
          accessibilityLabel={canGoBack ? '웹 뒤로가기' : '화면 닫기'}
        >
          <Ionicons name='arrow-back' size={24} color='#FFD700' />
        </TouchableOpacity>
        <Text style={styles.title}>GOLDEN RACE</Text>
        <TouchableOpacity onPress={reload} style={styles.iconButton}>
          <Ionicons name='refresh' size={24} color='#FFD700' />
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: initialUri }}
        style={styles.webview}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScriptBeforeContentLoaded="window.__IS_NATIVE_APP__=true;"
        onNavigationStateChange={onNavStateChange}
        onMessage={handleMessage}
        // 모바일 스크롤/터치/키보드 최적화
        scrollEnabled={true}
        bounces={true}
        overScrollMode="always"
        keyboardDisplayRequiresUserAction={false}
        cacheEnabled={true}
        allowsInlineMediaPlayback={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#0c0c0c',
  },
  title: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  iconButton: {
    padding: 5,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
