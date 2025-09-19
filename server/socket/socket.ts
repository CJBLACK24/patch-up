// server/socket/socket.ts

import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer, Socket } from "socket.io";
import { registerUserEvents } from "./userEvents";
import { registerChatEvents } from "./chatEvents";
import Conversation from "../modals/Conversation";
import { registerMessageEvents } from "./messageEvents";
import { registerAssistEvents } from "./assistEvents";

dotenv.config({ quiet: true }); 

export function initializeSocket(server: any): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // allow all origins
    },
  }); // socket io server instance

  // auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error(" Authentication error: no token provided"));
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      (err: any, decoded: any) => {
        if (err) {
          return next(new Error(" Authentication error: Invalid Token"));
        }

        // attach user data to socket
        let userData = decoded.user;
        socket.data = userData;
        socket.data.userId = userData.id;
        next();
      }
    );
  });

  // when socket connects, register events
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User Connected: ${userId}, username: ${socket.data.name}`);

    // register events
    registerChatEvents(io, socket);
    registerUserEvents(io, socket);
    registerMessageEvents(io, socket); 

    // NEW: assistance events
    registerAssistEvents(io, socket);

    // join all the conversation the user is part of
    try {
      const conversation = await Conversation.find({
        participants: userId,
      }).select("_id");

      conversation.forEach((conversation) => {
        socket.join(conversation._id.toString());
      });
    } catch (error: any) {
      console.log("Error joining conversation", error);
    }

    socket.on("disconnect", () => {
      // user log out
      console.log(`user disconnected: ${userId}`);
    });
  });

  return io;
}
