import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the WebApp shell immediately
    router.replace('/webview');
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
