import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function Index() {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        const data = response?.notification?.request?.content?.data as { deepLink?: string } | undefined;
        const deepLink = data?.deepLink;
        if (cancelled) return;
        done.current = true;
        if (deepLink) {
          router.replace({ pathname: '/webview', params: { initialUrl: deepLink } });
        } else {
          router.replace('/webview');
        }
      } catch {
        if (!cancelled) {
          done.current = true;
          router.replace('/webview');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0c0c0c',
      }}
    >
      <ActivityIndicator size='large' color='#FFD700' />
    </View>
  );
}
