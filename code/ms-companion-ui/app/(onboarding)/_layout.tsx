import { Stack } from 'expo-router';

/** E1 first-time setup after registering: consent per data type, then the profile. */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="consent" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
