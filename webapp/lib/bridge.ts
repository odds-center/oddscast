// Define known types for autocompletion, but allow any string
export type NativeMessageType =
  | 'AUTH_READY'
  | 'NAVIGATION'
  | string;

interface NativeMessage {
  type: NativeMessageType;
  payload?: unknown;
}

declare global {
  interface Window {
    /** Injected by react-native-webview when WebView loads (for postMessage) */
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    /** Injected by mobile/app/webview.tsx's injectedJavaScriptBeforeContentLoaded */
    __IS_NATIVE_APP__?: boolean;
    onNativeMessage?: (message: NativeMessage) => void;
  }
}

class NativeBridge {
  private static instance: NativeBridge;
  private listeners: { [key: string]: ((payload: unknown) => void)[] } = {};

  private constructor() {
    if (typeof window !== 'undefined') {
      const handler = this.handleMessage.bind(this);
      window.onNativeMessage = handler;
      // Also receive Native messages via postMessage (compatible with Mobile injectJavaScript)
      window.addEventListener('message', (e: MessageEvent) => {
        try {
          if (typeof e.data === 'string') {
            const data = JSON.parse(e.data) as NativeMessage;
            // Only process Native Bridge format (LOGIN_SUCCESS, etc. - exclude other postMessages like GSI)
            if (data?.type && /^(AUTH_READY|ECHO|NAVIGATION)/.test(data.type)) {
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

  /** Whether running inside WebView — determined by __IS_NATIVE_APP__ (injected by mobile) or ReactNativeWebView */
  public isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.__IS_NATIVE_APP__ ?? window.ReactNativeWebView);
  }

  /** Whether messages can be sent to Native (ReactNativeWebView required) */
  public canSendToNative(): boolean {
    return typeof window !== 'undefined' && !!window.ReactNativeWebView;
  }

  /** Send message to Native app */
  public send(type: NativeMessageType, payload?: unknown) {
    if (this.canSendToNative()) {
      window.ReactNativeWebView!.postMessage(JSON.stringify({ type, payload }));
    } else if (this.isNativeApp()) {
      console.warn('NativeBridge: ReactNativeWebView not ready yet', { type, payload });
    } else {
      console.warn('NativeBridge: Not running in native app', { type, payload });
    }
  }

  // Subscribe to messages from native app
  public subscribe(type: NativeMessageType, callback: (payload: unknown) => void) {
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
