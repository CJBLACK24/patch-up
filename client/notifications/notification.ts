// notifications/notification.ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Foreground behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // iOS-specific flags required by newer typings
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isAndroidFcmConfigured(): boolean {
  const expoCfg = (Constants as any)?.expoConfig || {};
  const androidCfg = expoCfg?.android || {};
  return Boolean(androidCfg.googleServicesFile);
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device.");
      return null;
    }

    // Permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Permission not granted for notifications.");
      return null;
    }

    // Skip Android token if FCM not configured (avoid noisy warning)
    if (Platform.OS === "android" && !isAndroidFcmConfigured()) {
      console.log(
        "Android push token skipped: FCM not configured. Foreground local notifications will still work."
      );
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: "default",
      });
      return null;
    }

    // EAS projectId
    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: "default",
      });
    }

    return token;
  } catch (e) {
    console.log("registerForPushNotificationsAsync error (non-fatal):", e);
    return null;
  }
}

export async function showLocalMessageNotification(params: {
  senderName: string;
  preview: string;
  conversationId: string;
}) {
  const { senderName, preview, conversationId } = params;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: senderName,
        body: preview || "New message",
        sound: "default",
        data: { conversationId },
      },
      trigger: null,
    });
  } catch (e) {
    console.log("showLocalMessageNotification error:", e);
  }
}
