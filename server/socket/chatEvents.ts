// client/socket/chatEvents.ts

import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation";
import "../modals/Message";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {
  socket.on("getConversations", async () => {
    console.log("getConversations event: ");
    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("getConversations", {
          success: false,
          msg: "Unauthorized",
        });
        return;
      }

      //fetch conversations where user is a participant
      const conversations = await Conversation.find({
        participants: userId,
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: "lastMessage",
          select: "content senderId attachment createdAt",
        })
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .lean();

      socket.emit("getConversations", {
        success: true,
        data: conversations,
      });
    } catch (error: any) {
      console.log("getConversations error:", error);
      socket.emit("getConversations", {
        success: false,
        msg: "Failed to fetch conversations",
      });
    }
  });

  console.log("getConversations event: ");
  socket.on("newConversation", async (data) => {
    console.log("newConversation event: ", data);

    try {
      if (data.type == "direct") {
        const existingConversation = await Conversation.findOne({
          type: "direct",
          participants: { $all: data.participants, $size: 2 },
        })
          .populate({
            path: "participants",
            select: "name avatar email",
          })
          .lean();

        if (existingConversation) {
          socket.emit("newConversation", {
            success: true,
            data: { ...existingConversation, isNew: false },
          });
          return;
        }
      }

      // create new conversation
      const conversation = await Conversation.create({
        type: data.type,
        participants: data.participants,
        name: data.name || "", // can be empty if direct conversation
        avatar: data.avatar || "", // same
        createdBy: socket.data.userId,
      });

      // get all connected sockets
      const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => data.participants.includes(s.data.userId)
      );

      //join this conversation by all online participants
      connectedSockets.forEach((participantsSocket) => {
        participantsSocket.join(conversation._id.toString());
      });

      // send conversation data back (populated)

      const populatedConversation = await Conversation.findById(
        conversation._id
      ).populate({
        path: "participants",
        select: "name avatar email",
      });
    } catch (error: any) {
      console.log("newConversation error:", error);
      socket.emit("newConversation", {
        success: false,
        msg: "failed to created conversation",
      });
    }
  });
}
