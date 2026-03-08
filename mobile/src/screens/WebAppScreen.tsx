import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Platform,
  BackHandler,
  Image,
  StatusBar,
  Linking,
  AppState,
  Alert,
  Keyboard,
  type AppStateStatus,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useRoute, RouteProp } from '@react-navigation/native';
import { config } from '../config';
import { getPushToken, setForegroundHandler } from '../push';
import { executeAction, getCapabilities } from '../nativeActions';

type RootStackParamList = {
  Index: undefined;
  Webview: { initialUrl?: string };
  NotFound: undefined;
};

const WEBAPP_URL = config.webappUrl;
const API_BASE = config.apiBaseUrl;

// Pages where Android back button should minimize the app (not go back)
const ROOT_PATHS = ['/', '/auth/login', '/auth/register'];

// Double-tap back to exit: interval within which second press exits app
const BACK_EXIT_INTERVAL_MS = 2000;

// Toast auto-dismiss duration
const EXIT_TOAST_DURATION_MS = 2000;

// Background threshold: reload WebView if app was in background longer than this
const BACKGROUND_RELOAD_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Bridge message protocol:
 *
 *   WebApp → Native:
 *     NATIVE_ACTION   { action, params, callbackId? }   — dynamic dispatch to nativeActions registry
 *     AUTH_READY      { token, refreshToken }            — JWT available
 *     AUTH_LOGOUT     {}                                 — user logged out
 *     TOKEN_REFRESHED { token, refreshToken }            — silent refresh completed
 *     ECHO            {}                                 — health check
 *
 *   Native → WebApp:
 *     NATIVE_ACTION_RESULT  { callbackId, result?, error? }  — response to NATIVE_ACTION
 *     CAPABILITIES          { actions: string[] }             — sent on load
 *     NAVIGATE              { path }                          — deep link from notification
 *     ECHO_REPLY            {}                                — response to ECHO
 */

export default function WebAppScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Webview'>>();
  const { initialUrl } = route.params ?? {};

  // Default initial URL: login page (webapp redirects to home if already logged in)
  const initialUri =
    initialUrl && initialUrl.trim()
      ? initialUrl.startsWith('http')
        ? initialUrl.trim()
        : `${WEBAPP_URL}${initialUrl.startsWith('/') ? '' : '/'}${initialUrl.trim()}`
      : `${WEBAPP_URL}/auth/login`;

  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const currentUrlRef = useRef(initialUri);
  const pushTokenRef = useRef<string | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const hasRegisteredRef = useRef(false);

  // Double-tap back to exit (Android)
  const lastBackPressRef = useRef(0);
  const exitToastTranslateY = useSharedValue(100);
  const exitToastOpacity = useSharedValue(0);

  // Background time tracking for stale reload
  const backgroundAtRef = useRef<number | null>(null);

  // Splash overlay
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [splashDismissed, setSplashDismissed] = useState(false);
  const splashOpacity = useSharedValue(1);

  // Network error
  const [loadError, setLoadError] = useState<string | null>(null);

  // Status bar
  const [statusBarStyle, setStatusBarStyle] = useState<'light-content' | 'dark-content'>('light-content');

  // --- Splash fade-out ---
  useEffect(() => {
    if (webViewLoaded && !splashDismissed) {
      splashOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(setSplashDismissed)(true);
      });
    }
  }, [webViewLoaded, splashDismissed, splashOpacity]);

  const splashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  // Exit toast animated style
  const exitToastAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: exitToastTranslateY.value }],
    opacity: exitToastOpacity.value,
  }));

  // Show exit toast with auto-dismiss animation
  const showExitToast = useCallback(() => {
    // Slide up + fade in
    exitToastTranslateY.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
    exitToastOpacity.value = withTiming(1, { duration: 250 });

    // Auto-dismiss: fade out + slide down after delay
    exitToastTranslateY.value = withDelay(
      EXIT_TOAST_DURATION_MS,
      withTiming(100, { duration: 300, easing: Easing.in(Easing.cubic) }),
    );
    exitToastOpacity.value = withDelay(
      EXIT_TOAST_DURATION_MS,
      withTiming(0, { duration: 300 }),
    );
  }, [exitToastTranslateY, exitToastOpacity]);

  // --- Send message to WebView ---
  const sendToWeb = useCallback((type: string, payload?: unknown) => {
    const msg = JSON.stringify({ type, payload: payload || {} });
    const script = `
      (function(){
        var msg=${msg};
        window.postMessage(JSON.stringify(msg),'*');
        if(window.onNativeMessage) window.onNativeMessage(msg);
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  // --- Push registration ---
  const tryRegisterPush = useCallback(async () => {
    const token = pushTokenRef.current;
    const accessToken = authTokenRef.current;
    if (!token || !accessToken || !API_BASE || hasRegisteredRef.current) return;
    try {
      const DeviceInfo = (await import('react-native-device-info')).default;
      const deviceId = await DeviceInfo.getModel();
      const res = await fetch(`${API_BASE}/notifications/push-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token, deviceId: deviceId ?? undefined }),
      });
      if (res.ok) hasRegisteredRef.current = true;
    } catch (e) {
      console.warn('Push subscribe failed', e);
    }
  }, []);

  // Initial push token
  useEffect(() => {
    (async () => {
      const token = await getPushToken();
      if (token) {
        pushTokenRef.current = token;
        tryRegisterPush();
      }
    })();
  }, [tryRegisterPush]);

  // --- Foreground notification ---
  useEffect(() => {
    const unsubscribe = setForegroundHandler((remoteMessage) => {
      const notification = remoteMessage?.notification;
      if (!notification) return;
      const deepLink = (remoteMessage?.data as Record<string, unknown>)?.deepLink as string | undefined;
      Alert.alert(
        notification.title ?? 'OddsCast',
        notification.body ?? '',
        deepLink
          ? [
              { text: 'Close', style: 'cancel' },
              { text: 'View', onPress: () => sendToWeb('NAVIGATE', { path: deepLink }) },
            ]
          : [{ text: 'OK' }],
      );
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [sendToWeb]);

  // --- App state: ping on resume + reload if stale ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Record when app went to background
        backgroundAtRef.current = Date.now();
        // Dismiss keyboard when backgrounding to prevent layout issues on resume
        Keyboard.dismiss();
      } else if (nextState === 'active') {
        // Reload WebView if app was in background too long (stale data)
        if (
          backgroundAtRef.current &&
          Date.now() - backgroundAtRef.current > BACKGROUND_RELOAD_THRESHOLD_MS
        ) {
          webViewRef.current?.reload();
        }
        backgroundAtRef.current = null;

        // Ping webapp to check liveness
        if (authTokenRef.current) {
          sendToWeb('ECHO');
        }
      }
    });
    return () => subscription.remove();
  }, [sendToWeb]);

  // --- Send CAPABILITIES when WebView loads ---
  useEffect(() => {
    if (webViewLoaded) {
      sendToWeb('CAPABILITIES', { actions: getCapabilities() });
    }
  }, [webViewLoaded, sendToWeb]);

  // --- Android back button with double-tap-to-exit ---
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = () => {
      // If WebView can go back in its history, just go back
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }

      const url = currentUrlRef.current;
      let isRootPath = false;
      try {
        const parsed = new URL(url);
        const pathname = (parsed as unknown as { pathname: string }).pathname ?? '';
        isRootPath = ROOT_PATHS.includes(pathname) || pathname === '';
      } catch {
        isRootPath = true;
      }

      if (isRootPath) {
        // Double-tap to exit: first press shows toast, second press exits immediately
        const now = Date.now();
        if (now - lastBackPressRef.current < BACK_EXIT_INTERVAL_MS) {
          BackHandler.exitApp();
        } else {
          lastBackPressRef.current = now;
          showExitToast();
        }
        return true;
      }

      // Not on root path — navigate to home
      webViewRef.current?.injectJavaScript("window.location.href='/';true;");
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [canGoBack]);

  // --- WebView navigation ---
  const onNavStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack ?? false);
    if (navState.url) currentUrlRef.current = navState.url;
    if (!navState.loading && navState.url) setLoadError(null);
  };

  // --- External URL handling ---
  const onShouldStartLoadWithRequest = useCallback((req: { url: string }) => {
    const { url } = req;
    if (url.startsWith(WEBAPP_URL)) return true;
    if (url.startsWith('about:') || url.startsWith('data:')) return true;
    if (/^(tel|mailto|sms|intent):/.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    if (url.startsWith('http') && !url.startsWith(WEBAPP_URL)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  // ==============================================================
  // Bridge message handler — single entry point for all WebApp→Native
  // ==============================================================
  const handleMessage = useCallback(
    async (event: { nativeEvent: { data: string } }) => {
      let data: { type: string; payload?: Record<string, unknown> };
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      const { type, payload } = data;

      switch (type) {
        // ---- Dynamic action dispatch (core mechanism) ----
        case 'NATIVE_ACTION': {
          const action = payload?.action as string | undefined;
          const params = (payload?.params as Record<string, unknown>) ?? {};
          const callbackId = payload?.callbackId as string | undefined;

          if (!action) {
            if (callbackId) {
              sendToWeb('NATIVE_ACTION_RESULT', { callbackId, error: 'No action specified' });
            }
            break;
          }

          // Inject native-held values that certain actions need
          params._authToken = authTokenRef.current;
          params._refreshToken = refreshTokenRef.current;
          params._pushToken = pushTokenRef.current;

          try {
            const result = await executeAction(action, params);

            // Handle statusBar action result locally
            if (action === 'statusBar' && result?.style) {
              setStatusBarStyle(
                result.style === 'dark' ? 'dark-content' : 'light-content',
              );
            }

            // Return result to webapp if callback requested
            if (callbackId) {
              sendToWeb('NATIVE_ACTION_RESULT', { callbackId, result });
            }
          } catch (err: unknown) {
            if (callbackId) {
              const msg = err instanceof Error ? err.message : String(err);
              sendToWeb('NATIVE_ACTION_RESULT', { callbackId, error: msg });
            }
          }
          break;
        }

        // ---- Auth messages (kept as dedicated types for reliability) ----
        case 'AUTH_READY': {
          if (payload?.token) {
            authTokenRef.current = payload.token as string;
            if (payload.refreshToken) refreshTokenRef.current = payload.refreshToken as string;
            tryRegisterPush();
          }
          break;
        }

        case 'TOKEN_REFRESHED': {
          if (payload?.token) {
            authTokenRef.current = payload.token as string;
            if (payload.refreshToken) refreshTokenRef.current = payload.refreshToken as string;
            hasRegisteredRef.current = false;
            tryRegisterPush();
          }
          break;
        }

        case 'AUTH_LOGOUT':
          authTokenRef.current = null;
          refreshTokenRef.current = null;
          hasRegisteredRef.current = false;
          break;

        case 'ROUTE_CHANGED': {
          // Update status bar based on route
          const path = payload?.path as string | undefined;
          if (path) {
            const isDarkPage = path.startsWith('/auth/');
            setStatusBarStyle(isDarkPage ? 'dark-content' : 'light-content');
          }
          break;
        }

        case 'ECHO':
          sendToWeb('ECHO_REPLY', payload);
          break;

        default:
          // Unknown type — silently ignore (webapp may be newer than native)
          break;
      }
    },
    [tryRegisterPush, sendToWeb],
  );

  const handleWebViewError = (event: { nativeEvent: { description: string } }) => {
    setLoadError(event.nativeEvent.description || 'Failed to load page');
  };

  const handleRetry = () => {
    setLoadError(null);
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor="#0c0c0c" />

      <WebView
        ref={webViewRef}
        source={{ uri: initialUri }}
        style={styles.webview}
        startInLoadingState={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScriptBeforeContentLoaded="window.__IS_NATIVE_APP__=true;"
        onNavigationStateChange={onNavStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onMessage={handleMessage}
        onLoadEnd={() => setWebViewLoaded(true)}
        onError={handleWebViewError}
        scrollEnabled={true}
        bounces={Platform.OS === 'ios'}
        overScrollMode={Platform.OS === 'android' ? 'never' : 'always'}
        keyboardDisplayRequiresUserAction={false}
        cacheEnabled={true}
        allowsInlineMediaPlayback={true}
        pullToRefreshEnabled={true}
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        mediaPlaybackRequiresUserAction={false}
        allowFileAccess={true}
        mixedContentMode="compatibility"
        originWhitelist={['https://*', 'http://*']}
        setSupportMultipleWindows={false}
        allowsLinkPreview={false}
        sharedCookiesEnabled={true}
        automaticallyAdjustContentInsets={true}
        contentInsetAdjustmentBehavior="automatic"
        // Android: hardware-accelerated rendering for smoother scrolling
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        // Prevent text selection in WebView for native feel
        textInteractionEnabled={false}
      />

      {/* Network error overlay */}
      {loadError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{loadError}</Text>
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exit toast bar */}
      <Animated.View
        style={[styles.exitToast, exitToastAnimatedStyle]}
        pointerEvents="none"
      >
        <View style={styles.exitToastInner}>
          <Text style={styles.exitToastText}>
            한 번 더 누르면 종료합니다
          </Text>
        </View>
      </Animated.View>

      {/* Splash overlay */}
      {!splashDismissed && (
        <Animated.View
          style={[styles.splashOverlay, splashAnimatedStyle]}
          pointerEvents={webViewLoaded ? 'none' : 'auto'}
        >
          <Image
            source={require('../../assets/images/splash-icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0c0c0c',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  splashLogo: { width: 120, height: 120 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0c0c0c',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 5,
  },
  errorIcon: {
    fontSize: 48, color: '#FFD700', fontWeight: 'bold', marginBottom: 16,
    width: 64, height: 64, lineHeight: 64, textAlign: 'center',
    borderRadius: 32, borderWidth: 3, borderColor: '#FFD700', overflow: 'hidden',
  },
  errorTitle: { color: '#ffffff', fontSize: 20, fontWeight: '600', marginBottom: 8 },
  errorMessage: { color: '#999999', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryButton: {
    backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 8, minWidth: 120, alignItems: 'center',
  },
  retryButtonText: { color: '#0c0c0c', fontSize: 16, fontWeight: '600' },
  exitToast: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  exitToastInner: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exitToastText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
