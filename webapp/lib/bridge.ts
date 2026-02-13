// Define known types for autocompletion, but allow any string
export type NativeMessageType =
  | 'LOGIN_GOOGLE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'AUTH_READY'
  | 'NAVIGATION'
  | string;

interface NativeMessage {
  type: NativeMessageType;
  payload?: any;
}

declare global {
  interface Window {
    /** react-native-webview가 WebView 로드 시 주입 (postMessage용) */
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    /** mobile/app/webview.tsx의 injectedJavaScriptBeforeContentLoaded로 주입 */
    __IS_NATIVE_APP__?: boolean;
    onNativeMessage?: (message: NativeMessage) => void;
  }
}

class NativeBridge {
  private static instance: NativeBridge;
  private listeners: { [key: string]: ((payload: any) => void)[] } = {};

  private constructor() {
    if (typeof window !== 'undefined') {
      const handler = this.handleMessage.bind(this);
      window.onNativeMessage = handler;
      // postMessage로 전달되는 Native 메시지도 수신 (Mobile injectJavaScript 호환)
      window.addEventListener('message', (e: MessageEvent) => {
        try {
          if (typeof e.data === 'string') {
            const data = JSON.parse(e.data) as NativeMessage;
            // Native Bridge 형식만 처리 (LOGIN_SUCCESS 등 - GSI 등 다른 postMessage 제외)
            if (data?.type && /^(LOGIN_|AUTH_READY|ECHO|NAVIGATION)/.test(data.type)) {
              handler(data);
            }
          }
        } catch {
          /* ignore */
        }
      });
    }
  }

  public static getInstance(): NativeBridge {
    if (!NativeBridge.instance) {
      NativeBridge.instance = new NativeBridge();
    }
    return NativeBridge.instance;
  }

  /** WebView 내부인지 여부 — __IS_NATIVE_APP__(mobile 주입) 또는 ReactNativeWebView로 판단 */
  public isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.__IS_NATIVE_APP__ ?? window.ReactNativeWebView);
  }

  /** Native로 메시지 전송 가능 여부 (ReactNativeWebView 필수) */
  public canSendToNative(): boolean {
    return typeof window !== 'undefined' && !!window.ReactNativeWebView;
  }

  /** Native 앱으로 메시지 전송 */
  public send(type: NativeMessageType, payload?: any) {
    if (this.canSendToNative()) {
      window.ReactNativeWebView!.postMessage(JSON.stringify({ type, payload }));
    } else if (this.isNativeApp()) {
      console.warn('NativeBridge: ReactNativeWebView not ready yet', { type, payload });
    } else {
      console.warn('NativeBridge: Not running in native app', { type, payload });
    }
  }

  // Subscribe to messages from native app
  public subscribe(type: NativeMessageType, callback: (payload: any) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[type] = this.listeners[type].filter((cb) => cb !== callback);
    };
  }

  // Handle messages from native app
  private handleMessage(message: NativeMessage) {
    const { type, payload } = message;
    const callbacks = this.listeners[type];
    if (callbacks) {
      callbacks.forEach((callback) => callback(payload));
    }
  }
}

export default NativeBridge.getInstance();
