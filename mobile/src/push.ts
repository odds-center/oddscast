/**
 * Push notifications — FCM (Firebase Cloud Messaging).
 * Replaces expo-notifications. Server must accept FCM tokens and send via Firebase Admin.
 */

export type LastNotificationData = { deepLink?: string; [key: string]: unknown } | null;

/** Firebase remote message shape (minimal) */
export interface RemoteMessage {
  notification?: { title?: string; body?: string };
  data?: Record<string, unknown>;
}

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
 * Set foreground handler so notifications can be shown in-app.
 * Receives the full remote message including notification title/body and data.
 */
export function setForegroundHandler(
  handler: (message: RemoteMessage) => void,
): (() => void) | undefined {
  let unsubscribe: (() => void) | undefined;
  import('@react-native-firebase/messaging').then(({ default: messaging }) => {
    unsubscribe = messaging().onMessage(async (remoteMessage) => {
      handler({
        notification: remoteMessage.notification
          ? { title: remoteMessage.notification.title, body: remoteMessage.notification.body }
          : undefined,
        data: (remoteMessage.data ?? {}) as Record<string, unknown>,
      });
    });
  });
  return () => {
    unsubscribe?.();
  };
}
