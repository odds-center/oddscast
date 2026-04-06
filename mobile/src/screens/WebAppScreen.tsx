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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

  // Load progress bar
  const loadProgress = useSharedValue(0);
  const loadProgressOpacity = useSharedValue(0);

  // Android swipe-back edge glow
  const swipeEdgeOpacity = useSharedValue(0);

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

  // Progress bar animated style
  const progressBarAnimatedStyle = useAnimatedStyle(() => ({
    width: `${loadProgress.value * 100}%` as unknown as number,
    opacity: loadProgressOpacity.value,
  }));

  // Android swipe-back edge glow animated style
  const swipeEdgeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: swipeEdgeOpacity.value,
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
    // Hide progress bar on error
    loadProgressOpacity.value = withTiming(0, { duration: 200 });
  };

  const handleRetry = () => {
    setLoadError(null);
    webViewRef.current?.reload();
  };

  const handleHomePress = () => {
    setLoadError(null);
    webViewRef.current?.injectJavaScript(`window.location.href='${WEBAPP_URL}';true;`);
  };

  // --- Progress bar handlers ---
  const handleLoadStart = useCallback(() => {
    loadProgress.value = 0;
    loadProgressOpacity.value = withTiming(1, { duration: 150 });
    loadProgress.value = withTiming(0.3, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [loadProgress, loadProgressOpacity]);

  const handleLoadProgress = useCallback(
    (event: { nativeEvent: { progress: number } }) => {
      const p = event.nativeEvent.progress;
      if (p > loadProgress.value) {
        loadProgress.value = withTiming(p, { duration: 200 });
      }
    },
    [loadProgress],
  );

  const handleLoadEnd = useCallback(() => {
    setWebViewLoaded(true);
    loadProgress.value = withTiming(1, { duration: 200 }, (finished) => {
      'worklet';
      if (finished) {
        loadProgressOpacity.value = withDelay(300, withTiming(0, { duration: 300 }));
        loadProgress.value = withDelay(600, withTiming(0, { duration: 0 }));
      }
    });
  }, [loadProgress, loadProgressOpacity]);

  // --- Android swipe-back gesture ---
  const goBackInWebView = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  const swipeBackGesture = Gesture.Pan()
    .enabled(Platform.OS === 'android')
    .activeOffsetX([10, 999]) // Only activate for rightward swipes, avoid conflicting with horizontal scroll
    .onUpdate((e) => {
      if (e.translationX > 0) {
        // Show edge glow proportional to swipe distance (max at 120px)
        const intensity = Math.min(e.translationX / 120, 1) * 0.6;
        swipeEdgeOpacity.value = intensity;
      }
    })
    .onEnd((e) => {
      swipeEdgeOpacity.value = withTiming(0, { duration: 200 });
      if (e.translationX > 80 && e.velocityX > 300 && canGoBack) {
        runOnJS(goBackInWebView)();
      }
    });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor="#0c0c0c" />

      {/* Navigation progress bar */}
      <Animated.View style={[styles.progressBarTrack]} pointerEvents="none">
        <Animated.View style={[styles.progressBar, progressBarAnimatedStyle]} />
      </Animated.View>

      <GestureDetector gesture={swipeBackGesture}>
        <View style={styles.webviewContainer}>
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
            onLoadStart={handleLoadStart}
            onLoadProgress={handleLoadProgress}
            onLoadEnd={handleLoadEnd}
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

          {/* Android swipe-back edge glow */}
          {Platform.OS === 'android' && (
            <Animated.View style={[styles.swipeEdgeGlow, swipeEdgeAnimatedStyle]} pointerEvents="none" />
          )}
        </View>
      </GestureDetector>

      {/* Network error overlay */}
      {loadError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorIconCircle}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorTitle}>페이지를 불러올 수 없습니다</Text>
          <Text style={styles.errorMessage}>
            네트워크 연결을 확인하거나{'\n'}잠시 후 다시 시도해주세요
          </Text>
          <View style={styles.errorButtonRow}>
            <TouchableOpacity onPress={handleHomePress} style={styles.homeButton} activeOpacity={0.7}>
              <Text style={styles.homeButtonText}>홈으로</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton} activeOpacity={0.7}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
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
  webviewContainer: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
  // Navigation progress bar
  progressBarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
    zIndex: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#16a34a',
    borderRadius: 1.5,
  },
  // Android swipe-back edge glow
  swipeEdgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 24,
    backgroundColor: 'rgba(22, 163, 74, 0.35)',
    shadowColor: '#16a34a',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
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
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconText: {
    fontSize: 28,
    color: '#d97706',
    fontWeight: 'bold',
    lineHeight: 32,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  errorMessage: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  homeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444444',
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  homeButtonText: { color: '#aaaaaa', fontSize: 15, fontWeight: '600' },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  retryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
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
