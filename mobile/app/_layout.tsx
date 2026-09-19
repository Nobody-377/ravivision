import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCartStore } from '../src/store/useCartStore';

export default function RootLayout() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    checkAuth();
    fetchCart();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="products/index" options={{ headerShown: false }} />
        <Stack.Screen name="products/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
        <Stack.Screen name="order-confirmation/[orderNumber]" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
