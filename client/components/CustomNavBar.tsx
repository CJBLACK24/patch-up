// client/app/components/CustomNavBar.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import * as Icons from "phosphor-react-native";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Bar + colors (unchanged)
const BAR_BG = "#1E1E1E";
const ACTIVE_PILL_BG = "#2A2A2A";
const INACTIVE_TEXT = "#B9B9B9";
const ACTIVE_GREEN = "#6EFF87";

// Only show these three tabs (kept as-is)
const ALLOWED_TABS = ["home", "message", "profile", "profileModal"];

const CustomNavBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {state.routes
          .filter((route) => ALLOWED_TABS.includes(route.name))
          .map((route) => {
            const actualIndex = state.routes.findIndex((r) => r.key === route.key);
            const routeName = route.name;
            const isFocused = state.index === actualIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const iconColor = isFocused ? ACTIVE_GREEN : INACTIVE_TEXT;
            const textColor = isFocused ? ACTIVE_GREEN : INACTIVE_TEXT;
            const showLabel = isFocused;
            const friendlyLabel =
              routeName === "message" ? "Chats" : routeName === "home" ? "Home" : "Profile";

            return (
              <Animated.View
                key={route.key}
                // ✅ Layout animation only on the wrapper
                layout={LinearTransition.springify().mass(0.5)}
              >
                <AnimatedTouchableOpacity
                  onPress={onPress}
                  // ❗️No `layout` here to avoid conflicts with transform below
                  style={[styles.tabItem, isFocused && styles.activePill]}
                  activeOpacity={0.85}
                >
                  <Animated.View
                    // ❗️No `layout` here; safe to use transform
                    style={isFocused ? { transform: [{ translateY: -2 }] } : undefined}
                  >
                    {getIconByRouteName(routeName, iconColor)}
                  </Animated.View>

                  {showLabel && (
                    <Animated.Text
                      entering={FadeIn.duration(140)}
                      exiting={FadeOut.duration(140)}
                      style={[styles.text, { color: textColor }]}
                    >
                      {friendlyLabel}
                    </Animated.Text>
                  )}
                </AnimatedTouchableOpacity>
              </Animated.View>
            );
          })}
      </View>
    </View>
  );
};

function getIconByRouteName(routeName: string, color: string) {
  switch (routeName) {
    case "home":
      return <Icons.House size={18} weight="bold" color={color} />;
    case "message":
      return <Icons.ChatCircleDots size={18} weight="bold" color={color} />;
    case "profile":
    case "profileModal":
      return <Icons.UserIcon size={18} weight="bold" color={color} />;
    default:
      return <Icons.House size={18} weight="bold" color={color} />;
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BAR_BG,
    zIndex: 100,
    elevation: 10,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
    gap: 4,
  },
  activePill: {
    backgroundColor: ACTIVE_PILL_BG,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CustomNavBar;
