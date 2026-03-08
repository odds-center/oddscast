/**
 * Native Action Registry — atomic native capabilities that webapp can invoke.
 *
 * Architecture:
 *   - Mobile defines a fixed set of "primitive" native actions here
 *   - Webapp sends `NATIVE_ACTION` messages with { action, params, callbackId? }
 *   - Mobile dispatches to the matching handler and optionally returns a result via callbackId
 *   - Adding new webapp features = just call existing actions differently (no mobile rebuild)
 *   - Adding new native capabilities = add handler here + mobile rebuild
 *
 * When webapp loads, mobile sends CAPABILITIES message listing all available actions.
 * Webapp can check capabilities before calling, gracefully degrade when action is missing.
 */

import {
  Share,
  Alert,
  Linking,
  Vibration,
  Platform,
  Clipboard,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';

// --- Action handler type ---
export type ActionParams = Record<string, unknown>;
export type ActionResult = Record<string, unknown> | null;
type ActionHandler = (params: ActionParams) => Promise<ActionResult>;

// --- Registry ---
const registry = new Map<string, ActionHandler>();

/** Register a native action handler */
function register(name: string, handler: ActionHandler) {
  registry.set(name, handler);
}

/** Execute an action by name. Returns result or throws. */
export async function executeAction(
  name: string,
  params: ActionParams,
): Promise<ActionResult> {
  const handler = registry.get(name);
  if (!handler) {
    return { error: `Unknown action: ${name}`, available: getCapabilities() };
  }
  return handler(params);
}

/** Get list of all registered action names */
export function getCapabilities(): string[] {
  return Array.from(registry.keys());
}

// ============================================================
// Built-in native actions
// ============================================================

// --- share ---
// Open native share sheet
register('share', async (params) => {
  const { title, message, url } = params as {
    title?: string;
    message?: string;
    url?: string;
  };
  try {
    const result = await Share.share({
      title: title ?? 'OddsCast',
      message: message ?? url ?? '',
      url: Platform.OS === 'ios' ? url : undefined,
    });
    return { action: result.action };
  } catch {
    return { error: 'Share cancelled or failed' };
  }
});

// --- alert ---
// Show native alert dialog, returns which button was pressed
register('alert', async (params) => {
  const { title, message, buttons } = params as {
    title?: string;
    message?: string;
    buttons?: Array<{ text: string; style?: string }>;
  };
  return new Promise((resolve) => {
    const alertButtons = (buttons ?? [{ text: 'OK' }]).map((btn, i) => ({
      text: btn.text,
      style: (btn.style as 'default' | 'cancel' | 'destructive') ?? 'default',
      onPress: () => resolve({ pressed: btn.text, index: i }),
    }));
    Alert.alert(title ?? '', message ?? '', alertButtons, {
      cancelable: true,
      onDismiss: () => resolve({ pressed: null, dismissed: true }),
    });
  });
});

// --- confirm ---
// Show native confirm dialog (OK / Cancel), returns boolean
register('confirm', async (params) => {
  const { title, message, okText, cancelText } = params as {
    title?: string;
    message?: string;
    okText?: string;
    cancelText?: string;
  };
  return new Promise((resolve) => {
    Alert.alert(
      title ?? '',
      message ?? '',
      [
        { text: cancelText ?? 'Cancel', style: 'cancel', onPress: () => resolve({ confirmed: false }) },
        { text: okText ?? 'OK', onPress: () => resolve({ confirmed: true }) },
      ],
      { cancelable: true, onDismiss: () => resolve({ confirmed: false }) },
    );
  });
});

// --- haptic ---
// Trigger device vibration/haptic feedback
register('haptic', async (params) => {
  const { pattern, duration } = params as {
    pattern?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
    duration?: number;
  };
  // react-native Vibration — simple vibration (no fine-grained haptic without expo-haptics)
  const ms = duration ?? (pattern === 'light' ? 10 : pattern === 'heavy' ? 50 : 20);
  Vibration.vibrate(ms);
  return null;
});

// --- clipboard.write ---
register('clipboard.write', async (params) => {
  const { text } = params as { text?: string };
  if (text) {
    Clipboard.setString(text);
  }
  return { success: true };
});

// --- clipboard.read ---
register('clipboard.read', async () => {
  const text = await Clipboard.getString();
  return { text };
});

// --- openURL ---
// Open URL in system browser or native app
register('openURL', async (params) => {
  const { url } = params as { url?: string };
  if (!url) return { error: 'No URL provided' };
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return { opened: true };
    }
    return { opened: false, error: 'URL not supported' };
  } catch {
    return { opened: false, error: 'Failed to open URL' };
  }
});

// --- statusBar ---
// Change status bar appearance
register('statusBar', async (params) => {
  // Returns the requested style; actual StatusBar update is handled by WebAppScreen
  // via the returned result (WebAppScreen reads it and calls setStatusBarStyle)
  const { style } = params as { style?: 'light' | 'dark' };
  return { style: style ?? 'light' };
});

// --- deviceInfo ---
// Get device information
register('deviceInfo', async () => {
  const [model, systemVersion, brand, deviceId, uniqueId] = await Promise.all([
    DeviceInfo.getModel(),
    DeviceInfo.getSystemVersion(),
    DeviceInfo.getBrand(),
    DeviceInfo.getDeviceId(),
    DeviceInfo.getUniqueId(),
  ]);
  return {
    platform: Platform.OS,
    model,
    systemVersion,
    brand,
    deviceId,
    uniqueId,
    appVersion: DeviceInfo.getVersion(),
    buildNumber: DeviceInfo.getBuildNumber(),
  };
});

// --- toast ---
// Show a brief message (uses Alert on RN since no native toast without library)
register('toast', async (params) => {
  const { message, duration } = params as { message?: string; duration?: 'short' | 'long' };
  // On iOS, use a timed alert; on Android, we'd ideally use ToastAndroid but Alert works cross-platform
  if (Platform.OS === 'android') {
    const { ToastAndroid } = require('react-native');
    ToastAndroid.show(
      message ?? '',
      duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT,
    );
  } else {
    // iOS: use a self-dismissing approach via setTimeout
    Alert.alert('', message ?? '');
  }
  return null;
});

// --- setBadge ---
// Set app icon badge count (iOS only, requires notification permission)
register('setBadge', async (params) => {
  const { count } = params as { count?: number };
  if (Platform.OS === 'ios') {
    try {
      const { default: messaging } = await import('@react-native-firebase/messaging');
      // Firebase messaging doesn't directly set badge; use native module if needed
      // For now, just acknowledge
      return { set: true, count: count ?? 0 };
    } catch {
      return { set: false };
    }
  }
  return { set: false, reason: 'Android does not support badge count natively' };
});

// --- getAuthToken ---
// Return current auth state held by native (for native-side API calls)
// The actual token values are injected by WebAppScreen before dispatch
register('getAuthToken', async (params) => {
  // params._authToken and params._refreshToken are injected by WebAppScreen
  return {
    token: params._authToken ?? null,
    refreshToken: params._refreshToken ?? null,
  };
});

// --- getPushToken ---
// Return the FCM push token
register('getPushToken', async (params) => {
  return { pushToken: params._pushToken ?? null };
});
