import { Stack } from 'expo-router';

export default function MyPageStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='profile' options={{ headerShown: false }} />
      <Stack.Screen name='profile-edit' options={{ headerShown: false }} />
      <Stack.Screen name='favorites' options={{ headerShown: false }} />
      <Stack.Screen name='notification-settings' options={{ headerShown: false }} />
      <Stack.Screen name='help' options={{ headerShown: false }} />
      <Stack.Screen name='points-earn' options={{ headerShown: false }} />
      <Stack.Screen name='points-use' options={{ headerShown: false }} />
      <Stack.Screen name='history' options={{ headerShown: false }} />
      <Stack.Screen name='notifications' options={{ headerShown: false }} />
      <Stack.Screen name='settings' options={{ headerShown: false }} />
      <Stack.Screen name='terms' options={{ headerShown: false }} />
    </Stack>
  );
}
