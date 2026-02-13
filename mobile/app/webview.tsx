import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// WebApp URL — dev: webapp port 3000, prod: 배포 URL
const WEBAPP_BASE =
  __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000'
    : 'https://gold-race-webapp.vercel.app';
const WEBAPP_URL = WEBAPP_BASE;

const webClientId =
  Constants.expoConfig?.extra?.webClientId as string | undefined;

if (webClientId) {
  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
  });
}

export default function WebAppScreen() {
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

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

  const sendToWeb = (type: string, payload?: any) => {
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

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Native received:', data);

      switch (data.type) {
        case 'LOGIN_GOOGLE':
          await handleGoogleLogin();
          break;
        case 'ECHO':
          sendToWeb('ECHO_REPLY', data.payload);
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (e) {
      console.error('Failed to parse message from WebView', e);
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
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // cancelled
      } else {
        console.error(error);
        sendToWeb('LOGIN_FAILURE', { error: error.message || 'Login failed' });
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
        source={{ uri: WEBAPP_URL }}
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
