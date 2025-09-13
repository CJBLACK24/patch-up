// server/socket/messageEvents.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import Message from "../modals/Message";
import Conversation from "../modals/Conversation";

export function registerMessageEvents(io: SocketIOServer, socket: Socket) {
  /**
   * Fetch message history for a conversation
   */
  socket.on("getMessages", async (conversationId: string) => {
    try {
      if (!socket.data.userId) {
        socket.emit("getMessages", {
          success: false,
          msg: "Unauthorized",
        });
        return;
      }

      const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 }) // newest first
        .limit(50)
        .populate("senderId", "name avatar email")
        .lean();

      socket.emit("getMessages", {
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("getMessages error:", error);
      socket.emit("getMessages", {
        success: false,
        msg: "Failed to fetch messages",
      });
    }
  });

  /**
   * Create a new message
   */
  socket.on(
    "newMessage",
    async (data: {
      conversationId: string;
      content?: string;
      attachment?: string;
    }) => {
      try {
        const { conversationId, content, attachment } = data;
        const senderId = socket.data.userId;

        if (!senderId || !conversationId) {
          socket.emit("newMessage", {
            success: false,
            msg: "Invalid payload",
          });
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

        // Populate sender
        const populated = await Message.findById(message._id)
          .populate("senderId", "name avatar email")
          .lean();

        // Broadcast to all participants in the conversation room
        io.to(conversationId).emit("newMessage", {
          success: true,
          data: populated,
        });
      } catch (error) {
        console.error("newMessage error:", error);
        socket.emit("newMessage", {
          success: false,
          msg: "Failed to send message",
        });
      }
    }
  );
}
