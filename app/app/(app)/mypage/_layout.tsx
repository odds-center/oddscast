import { Stack } from 'expo-router';

export default function MyPageStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}