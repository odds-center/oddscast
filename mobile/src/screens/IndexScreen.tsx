import { useEffect, useRef } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getLastNotificationData } from '../push';

type RootStackParamList = {
  Index: undefined;
  Webview: { initialUrl?: string };
  NotFound: undefined;
};

export default function IndexScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Index'>>();
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
          navigation.replace('Webview', {});
        }
      } catch {
        if (!cancelled) {
          done.current = true;
          navigation.replace('Webview', {});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  // Show branded splash that matches the native splash screen (seamless transition)
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c0c0c',
  },
  logo: {
    width: 120,
    height: 120,
  },
});
