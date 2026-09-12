import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="add-job" options={{ presentation: 'modal' }} />
        <Stack.Screen name="job-detail" />
      </Stack>
    </>
  );
}
