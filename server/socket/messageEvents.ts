import { Server as SocketIOServer, Socket } from "socket.io";
import Message from "../modals/Message";
import Conversation from "../modals/Conversation";
import ConversationMeta from "../modals/ConversationMeta";
import User from "../modals/User";
import Expo, { ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

function trimBody(s?: string) {
  if (!s) return "";
  return s.length > 160 ? s.slice(0, 157) + "..." : s;
}

// Accept a push payload WITHOUT the `to` property.
// We'll inject `to` for each token internally.
type PushPayloadWithoutTo = Omit<ExpoPushMessage, "to">;

async function sendPushToExpo(tokens: string[], message: PushPayloadWithoutTo) {
  const valid = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (valid.length === 0) return;

  const chunks = expo.chunkPushNotifications(
    valid.map<ExpoPushMessage>((token) => ({ to: token, ...message }))
  );

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (e) {
      console.error("Expo push chunk error:", e);
    }
  }
}

export function registerMessageEvents(io: SocketIOServer, socket: Socket) {
  /** Fetch message history for a conversation */
  socket.on("getMessages", async (conversationId: string) => {
    try {
      if (!socket.data.userId) {
        socket.emit("getMessages", { success: false, msg: "Unauthorized" });
        return;
      }

      const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("senderId", "name avatar email")
        .lean();

      socket.emit("getMessages", { success: true, data: messages });
    } catch (error) {
      console.error("getMessages error:", error);
      socket.emit("getMessages", {
        success: false,
        msg: "Failed to fetch messages",
      });
    }
  });

  /** Create a new message */
  socket.on(
    "newMessage",
    async (data: { conversationId: string; content?: string; attachment?: string }) => {
      try {
        const { conversationId, content, attachment } = data;
        const senderId = socket.data.userId;

        if (!senderId || !conversationId) {
          socket.emit("newMessage", { success: false, msg: "Invalid payload" });
          return;
        }

        // Save to DB
        const message = await Message.create({
          conversationId,
          senderId,
          content,
          attachment,
        });

        // Update conversation lastMessage
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        // Increment unread for everyone except sender
        const conversation = await Conversation.findById(conversationId)
          .select("participants")
          .lean();

        let otherParticipantIds: string[] = [];
        if (conversation) {
          otherParticipantIds = conversation.participants
            .map((p) => String(p))
            .filter((pid) => pid !== String(senderId));

          await ConversationMeta.updateMany(
            { conversationId, userId: { $in: otherParticipantIds } },
            { $inc: { unreadCount: 1 } }
          );
        }

        // Populate sender for broadcast
        const populated = await Message.findById(message._id)
          .populate("senderId", "name avatar email")
          .lean();

        // Broadcast the new message to the room
        io.to(conversationId).emit("newMessage", {
          success: true,
          data: { ...populated, conversationId },
        });

        // ✅ Tell the SENDER who received it (for local self-notification)
        if (otherParticipantIds.length) {
          const recipients = await User.find({ _id: { $in: otherParticipantIds } })
            .select("name")
            .lean();
          const deliveredTo = recipients.map((u) => u.name).filter(Boolean);

          io.to(socket.id).emit("messageDelivered", {
            success: true,
            conversationId,
            deliveredTo, // array of names
          });
        }

        // Personalized conversationUpdated
        const populatedConversation = await Conversation.findById(conversationId)
          .populate({
            path: "lastMessage",
            select: "content senderId attachment createdAt conversationId",
          })
          .populate({ path: "participants", select: "name avatar email" })
          .lean();

        if (populatedConversation) {
          for (const [socketId, s] of io.sockets.sockets) {
            const uid = String(s.data?.userId || "");
            if (!uid) continue;

            const isParticipant = populatedConversation.participants
              .map((p: any) => String(p._id))
              .includes(uid);
            if (!isParticipant) continue;

            const meta = await ConversationMeta.findOne({
              conversationId,
              userId: uid,
            })
              .select("unreadCount")
              .lean();

            const payload = {
              ...populatedConversation,
              unreadCount: meta?.unreadCount ?? 0,
            };

            io.to(socketId).emit("conversationUpdated", { success: true, data: payload });
          }
        }

        // Push notifications to others (works when FCM/APNs configured)
        if (otherParticipantIds.length) {
          const recipients = await User.find({
            _id: { $in: otherParticipantIds },
            expoPushToken: { $exists: true, $ne: "" },
          })
            .select("expoPushToken")
            .lean();

          const tokens = recipients.map((r) => r.expoPushToken!).filter(Boolean);
          if (tokens.length) {
            const senderName = (populated?.senderId as any)?.name || "Someone";
            const body = attachment ? "Sent a photo" : trimBody(content) || "New message";

            await sendPushToExpo(tokens, {
              title: senderName,
              body,
              sound: "default",
              data: { conversationId },
            });
          }
        }
      } catch (error) {
        console.error("newMessage error:", error);
        socket.emit("newMessage", { success: false, msg: "Failed to send message" });
      }
    }
  );

  /** Reset unread for the current user */
  socket.on("markAsRead", async (conversationId: string) => {
    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("markAsRead", { success: false, msg: "Unauthorized" });
        return;
      }

      await ConversationMeta.findOneAndUpdate(
        { conversationId, userId },
        { unreadCount: 0, lastReadAt: new Date() },
        { upsert: true }
      );

      const convo = await Conversation.findById(conversationId)
        .populate({
          path: "lastMessage",
          select: "content senderId attachment createdAt conversationId",
        })
        .populate({ path: "participants", select: "name avatar email" })
        .lean();

      if (convo) {
        socket.emit("conversationUpdated", {
          success: true,
          data: { ...convo, unreadCount: 0 },
        });
      }

      socket.emit("markAsRead", { success: true });
    } catch (error) {
      console.error("markAsRead error:", error);
      socket.emit("markAsRead", { success: false, msg: "Failed to mark as read" });
    }
  });
}
