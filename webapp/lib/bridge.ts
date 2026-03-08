/**
 * Native Bridge — bidirectional communication between WebView and React Native.
 *
 * ## Architecture
 *
 * Mobile app is a "native capability server" — it registers atomic actions
 * (share, alert, haptic, clipboard, deviceInfo, etc.) once, then webapp
 * calls them freely via `bridge.call('action', params)`.
 *
 * This means:
 *   - Webapp deploys instantly (Vercel) and can use any combination of native actions
 *   - Mobile only needs rebuild when adding NEW native capabilities
 *   - Webapp can check `bridge.capabilities` to gracefully degrade
 *
 * ## Protocol
 *
 *   WebApp → Native:
 *     NATIVE_ACTION   { action, params, callbackId? }   Dynamic dispatch
 *     AUTH_READY      { token, refreshToken }            JWT available
 *     AUTH_LOGOUT     {}                                 User logged out
 *     TOKEN_REFRESHED { token, refreshToken }            Token refreshed
 *     ECHO            {}                                 Health check
 *
 *   Native → WebApp:
 *     NATIVE_ACTION_RESULT  { callbackId, result?, error? }  Response
 *     CAPABILITIES          { actions: string[] }             On load
 *     NAVIGATE              { path }                          Deep link
 *     ECHO_REPLY            {}                                Echo response
 */

export type NativeMessageType = string;

interface NativeMessage {
  type: string;
  payload?: unknown;
}

// Known bridge message prefixes — filter out noise from Google Sign-In, analytics, etc.
const BRIDGE_TYPES = /^(NATIVE_ACTION|AUTH_READY|AUTH_LOGOUT|TOKEN_REFRESHED|ROUTE_CHANGED|CAPABILITIES|NAVIGATE|ECHO|ECHO_REPLY)/;

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
    __IS_NATIVE_APP__?: boolean;
    onNativeMessage?: (message: NativeMessage) => void;
  }
}

// --- Pending callback store ---
type PendingCallback = {
  resolve: (result: Record<string, unknown> | null) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

class NativeBridge {
  private static instance: NativeBridge;
  private listeners: Record<string, ((payload: unknown) => void)[]> = {};
  private pendingCallbacks = new Map<string, PendingCallback>();
  private callbackCounter = 0;

  /** Native capabilities — populated when mobile sends CAPABILITIES message */
  public capabilities: string[] = [];

  private constructor() {
    if (typeof window === 'undefined') return;

    const handler = this.handleMessage.bind(this);
    window.onNativeMessage = handler;

    window.addEventListener('message', (e: MessageEvent) => {
      try {
        if (typeof e.data === 'string') {
          const data = JSON.parse(e.data) as NativeMessage;
          if (data?.type && BRIDGE_TYPES.test(data.type)) {
            handler(data);
          }
        }
      } catch {
        /* ignore non-bridge messages */
      }
    });

    // Listen for CAPABILITIES from native
    this.subscribe('CAPABILITIES', (payload) => {
      const p = payload as { actions?: string[] };
      if (Array.isArray(p?.actions)) {
        this.capabilities = p.actions;
      }
    });

    // Listen for NATIVE_ACTION_RESULT — resolve pending callbacks
    this.subscribe('NATIVE_ACTION_RESULT', (payload) => {
      const p = payload as { callbackId?: string; result?: Record<string, unknown>; error?: string };
      if (!p?.callbackId) return;
      const pending = this.pendingCallbacks.get(p.callbackId);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pendingCallbacks.delete(p.callbackId);
      if (p.error) {
        pending.reject(new Error(p.error));
      } else {
        pending.resolve(p.result ?? null);
      }
    });
  }

  public static getInstance(): NativeBridge {
    if (!NativeBridge.instance) {
      NativeBridge.instance = new NativeBridge();
    }
    return NativeBridge.instance;
  }

  // --- Detection ---

  public isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.__IS_NATIVE_APP__ ?? window.ReactNativeWebView);
  }

  public canSendToNative(): boolean {
    return typeof window !== 'undefined' && !!window.ReactNativeWebView;
  }

  /** Check if native supports a specific action */
  public hasCapability(action: string): boolean {
    return this.capabilities.includes(action);
  }

  // --- Low-level send ---

  public send(type: string, payload?: unknown) {
    if (this.canSendToNative()) {
      window.ReactNativeWebView!.postMessage(JSON.stringify({ type, payload }));
    }
  }

  // --- Subscribe to messages from native ---

  public subscribe(type: string, callback: (payload: unknown) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback);
    return () => {
      this.listeners[type] = this.listeners[type].filter((cb) => cb !== callback);
    };
  }

  // ==============================================================
  // Core API: call() — invoke native action with optional result
  // ==============================================================

  /**
   * Call a native action and get the result back.
   *
   * @example
   * // Fire-and-forget (no result needed)
   * bridge.call('haptic', { pattern: 'light' });
   *
   * // With result
   * const info = await bridge.call('deviceInfo');
   * console.log(info.model, info.platform);
   *
   * // With capability check
   * if (bridge.hasCapability('share')) {
   *   await bridge.call('share', { title: 'Race #5', url: 'https://...' });
   * }
   */
  public call(
    action: string,
    params?: Record<string, unknown>,
    timeoutMs = 10000,
  ): Promise<Record<string, unknown> | null> {
    if (!this.canSendToNative()) {
      return Promise.reject(new Error('Not running in native app'));
    }

    const callbackId = `cb_${++this.callbackCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCallbacks.delete(callbackId);
        reject(new Error(`Native action "${action}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingCallbacks.set(callbackId, { resolve, reject, timer });

      this.send('NATIVE_ACTION', {
        action,
        params: params ?? {},
        callbackId,
      });
    });
  }

  /**
   * Fire-and-forget native action (no result, no callback overhead).
   */
  public fire(action: string, params?: Record<string, unknown>) {
    if (this.canSendToNative()) {
      this.send('NATIVE_ACTION', { action, params: params ?? {} });
    }
  }

  // ==============================================================
  // Convenience methods (auth — kept as dedicated messages for reliability)
  // ==============================================================

  public sendAuth(token: string, refreshToken?: string) {
    this.send('AUTH_READY', { token, refreshToken });
  }

  public sendLogout() {
    this.send('AUTH_LOGOUT');
  }

  public sendTokenRefreshed(token: string, refreshToken?: string) {
    this.send('TOKEN_REFRESHED', { token, refreshToken });
  }

  // ==============================================================
  // Convenience wrappers around call() for common actions
  // ==============================================================

  /** Open native share sheet */
  public async share(title: string, url: string, message?: string) {
    return this.call('share', { title, url, message });
  }

  /** Show native alert */
  public async alert(
    title: string,
    message: string,
    buttons?: Array<{ text: string; style?: string }>,
  ) {
    return this.call('alert', { title, message, buttons });
  }

  /** Show native confirm dialog */
  public async confirm(title: string, message: string, okText?: string, cancelText?: string) {
    const result = await this.call('confirm', { title, message, okText, cancelText });
    return !!(result as { confirmed?: boolean })?.confirmed;
  }

  /** Trigger haptic feedback */
  public haptic(pattern: 'light' | 'medium' | 'heavy' = 'light') {
    this.fire('haptic', { pattern });
  }

  /** Copy text to clipboard */
  public async copyToClipboard(text: string) {
    return this.call('clipboard.write', { text });
  }

  /** Read clipboard text */
  public async readClipboard() {
    const result = await this.call('clipboard.read');
    return (result as { text?: string })?.text ?? '';
  }

  /** Open URL in system browser */
  public openURL(url: string) {
    this.fire('openURL', { url });
  }

  /** Get device info */
  public async getDeviceInfo() {
    return this.call('deviceInfo');
  }

  /** Show toast message */
  public toast(message: string, duration: 'short' | 'long' = 'short') {
    this.fire('toast', { message, duration });
  }

  /** Set status bar style */
  public setStatusBar(style: 'light' | 'dark') {
    this.fire('statusBar', { style });
  }

  // --- Internal ---

  private handleMessage(message: NativeMessage) {
    const { type, payload } = message;
    const callbacks = this.listeners[type];
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }
}

export default NativeBridge.getInstance();
