// server/socket/chatEvents.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation";
import ConversationMeta from "../modals/ConversationMeta";
import "../modals/Message";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {
  /** ================= getConversations ================= */
  socket.on("getConversations", async () => {
    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("getConversations", {
          success: false,
          msg: "Unauthorized",
        });
        return;
      }

      const conversations = await Conversation.find({ participants: userId })
        .sort({ updatedAt: -1 })
        .populate({
          path: "lastMessage",
          select: "content senderId attachment createdAt conversationId",
        })
        .populate({ path: "participants", select: "name avatar email" })
        .lean();

      // ===== NEW: attach unreadCount for current user =====
      const convIds = conversations.map((c) => c._id);
      const metas = await ConversationMeta.find({
        conversationId: { $in: convIds },
        userId,
      })
        .select("conversationId unreadCount")
        .lean();

      const metaMap = new Map<string, number>();
      metas.forEach((m) =>
        metaMap.set(m.conversationId.toString(), m.unreadCount ?? 0)
      );

      const withUnread = conversations.map((c) => ({
        ...c,
        unreadCount: metaMap.get(c._id.toString()) ?? 0,
      }));

      socket.emit("getConversations", { success: true, data: withUnread });
    } catch (error: any) {
      console.log("getConversations error:", error);
      socket.emit("getConversations", {
        success: false,
        msg: "Failed to fetch conversations",
      });
    }
  });

  /** ================= newConversation ================= */
  socket.on("newConversation", async (data) => {
    try {
      if (data.type == "direct") {
        const existingConversation = await Conversation.findOne({
          type: "direct",
          participants: { $all: data.participants, $size: 2 },
        })
          .populate({ path: "participants", select: "name avatar email" })
          .lean();

        if (existingConversation) {
          socket.emit("newConversation", {
            success: true,
            data: { ...existingConversation, isNew: false, unreadCount: 0 },
          });
          return;
        }
      }

      // create new conversation
      const conversation = await Conversation.create({
        type: data.type,
        participants: data.participants,
        name: data.name || "",
        avatar: data.avatar || "",
        createdBy: socket.data.userId,
      });

      // ===== NEW: initialize metas with unread=0 =====
      await Promise.all(
        data.participants.map((uid: string) =>
          ConversationMeta.findOneAndUpdate(
            { conversationId: conversation._id, userId: uid },
            { $setOnInsert: { unreadCount: 0 } },
            { upsert: true, new: true }
          )
        )
      );

      // join rooms for online participants
      const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => data.participants.map(String).includes(String(s.data.userId))
      );
      connectedSockets.forEach((s) => s.join(conversation._id.toString()));

      // send populated conversation back
      const populatedConversation = await Conversation.findById(
        conversation._id
      )
        .populate({ path: "participants", select: "name avatar email" })
        .lean();

      // every recipient sees unreadCount=0 on a fresh conversation
      const payload = { ...populatedConversation, isNew: true, unreadCount: 0 };

      // emit to all participants that are connected
      connectedSockets.forEach((s) =>
        s.emit("newConversation", { success: true, data: payload })
      );
    } catch (error: any) {
      console.log("newConversation error:", error);
      socket.emit("newConversation", {
        success: false,
        msg: "failed to created conversation",
      });
    }
  });
}
