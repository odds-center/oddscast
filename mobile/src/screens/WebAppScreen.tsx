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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info';
import { config } from '../config';
import { getPushToken, setForegroundHandler } from '../push';

type RootStackParamList = {
  Index: undefined;
  Webview: { initialUrl?: string };
  NotFound: undefined;
};

const WEBAPP_URL = config.webappUrl;
const API_BASE = config.apiBaseUrl;

export default function WebAppScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Webview'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Webview'>>();
  const { initialUrl } = route.params ?? {};
  const initialUri =
    initialUrl && initialUrl.trim()
      ? initialUrl.startsWith('http')
        ? initialUrl.trim()
        : `${WEBAPP_URL}${initialUrl.startsWith('/') ? '' : '/'}${initialUrl.trim()}`
      : WEBAPP_URL;
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const pushTokenRef = useRef<string | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const hasRegisteredRef = useRef(false);

  useEffect(() => {
    setForegroundHandler(() => {
      // Optional: show in-app banner when notification received in foreground
    });
  }, []);

  const tryRegisterPush = async () => {
    const token = pushTokenRef.current;
    const accessToken = authTokenRef.current;
    if (!token || !accessToken || !API_BASE || hasRegisteredRef.current) return;
    try {
      const deviceId = await DeviceInfo.getModel();
      const res = await fetch(`${API_BASE}/notifications/push-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token,
          deviceId: deviceId ?? undefined,
        }),
      });
      if (res.ok) hasRegisteredRef.current = true;
    } catch (e) {
      console.warn('Push subscribe failed', e);
    }
  };

  useEffect(() => {
    (async () => {
      const token = await getPushToken();
      if (token) {
        pushTokenRef.current = token;
        tryRegisterPush();
      }
    })();
  }, []);

  const onNavStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack ?? false);
  };

  const handleBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    } else {
      navigation.goBack();
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
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        payload?: { token?: string };
      };

      switch (data.type) {
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
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.title}>GOLDEN RACE</Text>
        <TouchableOpacity onPress={reload} style={styles.iconButton}>
          <Ionicons name="refresh" size={24} color="#FFD700" />
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
