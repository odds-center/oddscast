// Define known types for autocompletion, but allow any string
export type NativeMessageType =
  | 'LOGIN_GOOGLE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'NAVIGATION'
  | string;

interface NativeMessage {
  type: NativeMessageType;
  payload?: any;
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
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
            if (data?.type && /^(LOGIN_|ECHO|NAVIGATION)/.test(data.type)) {
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

  // Check if running in the native app
  public isNativeApp(): boolean {
    return typeof window !== 'undefined' && !!window.ReactNativeWebView;
  }

  // Send message to native app
  public send(type: NativeMessageType, payload?: any) {
    if (this.isNativeApp()) {
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type, payload }));
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
