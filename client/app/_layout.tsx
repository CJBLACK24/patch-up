// app/_layout.tsx
import React, { useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

import { AuthProvider } from "@/contexts/authContext";
import { colors } from "@/constants/theme";

// Keep splash visible until fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Candal: require("../assets/fonts/Candal-Regular.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: colors.black },
            }}
          >
            {/* The (main) group has its own Tabs defined in app/(main)/_layout.tsx */}
            <Stack.Screen name="(main)" options={{ headerShown: false }} />

            {/* Non-tab/overlay screens */}
            <Stack.Screen name="conversation" options={{ headerShown: false }} />

           
           
          </Stack>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
