// app/(main)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import CustomNavBar from "@/components/CustomNavBar";

export default function MainTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomNavBar {...props} />}
      screenOptions={{ headerShown: false }} // hide the white header
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="message" options={{ title: "Message" }} />
      <Tabs.Screen name="profileModal" options={{ title: "Profile" }} />
    </Tabs>
  );
}

