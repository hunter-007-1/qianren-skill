import { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "./lib/auth";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}