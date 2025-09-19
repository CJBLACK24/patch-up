import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { AppState, AppStateStatus } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/authContext";
import { getSocket } from "@/socket/socket";
import { registerPushToken } from "@/socket/socketEvents";

// Relative from app/components → app/notifications
import {
  registerForPushNotificationsAsync,
  showLocalMessageNotification,
} from "../notifications/notification";

export default function NotificationBridge() {
  const { user } = useAuth();
  const router = useRouter();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // track app foreground/background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => (appState.current = s));
    return () => sub.remove();
  }, []);

  // register device push token & send to server after login
  useEffect(() => {
    (async () => {
      if (!user) return;
      const token = await registerForPushNotificationsAsync();
      const socket = getSocket();
      if (token && socket) registerPushToken({ token });
    })();
  }, [user]);

  // navigate when tapping a notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const convId = resp.notification.request.content.data?.conversationId as string | undefined;
      if (convId) {
        router.push({ pathname: "/(main)/conversation", params: { id: convId } });
      }
    });
    return () => sub.remove();
  }, [router]);

  // Local (foreground) toast when someone else sends me a message
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (evt: any) => {
      if (!evt?.success || !evt?.data) return;
      const me = user?.id;
      const m = evt.data;

      // only if app is active and I'm not the sender
      if (appState.current === "active" && String(m.senderId?._id || m.senderId) !== String(me)) {
        const preview = m.attachment ? "Sent a photo" : (m.content || "New message");
        const senderName = m.senderId?.name || "Someone";
        showLocalMessageNotification({
          senderName,
          preview,
          conversationId: m.conversationId,
        });
      }
    };

    socket.on("newMessage", onNewMessage);
    return () => {
      socket.off("newMessage", onNewMessage);
    };
  }, [user]);

  // ✅ Local toast to myself when my message is delivered to others
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDelivered = (evt: any) => {
      if (!evt?.success) return;
      const names: string[] = Array.isArray(evt.deliveredTo) ? evt.deliveredTo : [];
      const who = names.length ? names.join(", ") : "recipient";
      showLocalMessageNotification({
        senderName: "Delivered",
        preview: `Your message was delivered to ${who}`,
        conversationId: evt.conversationId,
      });
    };

    socket.on("messageDelivered", onDelivered);
    return () => {
      socket.off("messageDelivered", onDelivered);
    };
  }, []);

  return null;
}
