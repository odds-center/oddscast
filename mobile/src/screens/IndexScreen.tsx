import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getLastNotificationData } from '../push';

type RootStackParamList = {
  Index: undefined;
  Webview: { initialUrl?: string };
  NotFound: undefined;
};

export default function IndexScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Index'>>();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getLastNotificationData();
        const deepLink = data?.deepLink as string | undefined;
        if (cancelled) return;
        done.current = true;
        if (deepLink) {
          navigation.replace('Webview', { initialUrl: deepLink });
        } else {
          navigation.replace('Webview' as never);
        }
      } catch {
        if (!cancelled) {
          done.current = true;
          navigation.replace('Webview' as never);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0c0c0c',
      }}
    >
      <ActivityIndicator size="large" color="#FFD700" />
    </View>
  );
}
