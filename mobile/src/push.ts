/**
 * Push notifications — FCM (Firebase Cloud Messaging).
 * Replaces expo-notifications. Server must accept FCM tokens and send via Firebase Admin.
 */

export type LastNotificationData = { deepLink?: string; [key: string]: unknown } | null;

/**
 * Request permission and return FCM token, or null if unavailable.
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const { default: messaging } = await import('@react-native-firebase/messaging');
    const authStatus = await messaging().requestPermission();
    if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
        authStatus !== messaging.AuthorizationStatus.PROVISIONAL) {
      return null;
    }
    const token = await messaging().getToken();
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Get data from the notification that opened the app (if any).
 */
export async function getLastNotificationData(): Promise<LastNotificationData> {
  try {
    const { default: messaging } = await import('@react-native-firebase/messaging');
    const msg = await messaging().getInitialNotification();
    if (!msg?.data) return null;
    return msg.data as LastNotificationData;
  } catch {
    return null;
  }
}

/**
 * Set foreground handler so notifications show in-app.
 */
export function setForegroundHandler(handler: (data: Record<string, unknown>) => void): () => void {
  let unsubscribe: (() => void) | null = null;
  import('@react-native-firebase/messaging').then(({ default: messaging }) => {
    unsubscribe = messaging().onMessage(async (remoteMessage) => {
      handler((remoteMessage.data ?? {}) as Record<string, unknown>);
    });
  });
  return () => {
    unsubscribe?.();
  };
}
