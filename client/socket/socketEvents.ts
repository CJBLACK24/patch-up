import { getSocket } from "./socket";

/** Utility to DRY the pattern */
function wire(event: string, payload: any, off: boolean = false) {
  const socket = getSocket();
  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    socket.off(event, payload);
  } else if (typeof payload === "function") {
    socket.on(event, payload);
  } else {
    socket.emit(event, payload);
  }
}

export const testSocket = (payload: any, off: boolean = false) =>
  wire("testSocket", payload, off);

export const updateProfile = (payload: any, off: boolean = false) =>
  wire("updateProfile", payload, off);

export const getContacts = (payload: any, off: boolean = false) =>
  wire("getContacts", payload, off);

export const newConversation = (payload: any, off: boolean = false) =>
  wire("newConversation", payload, off);

export const getConversations = (payload: any, off: boolean = false) =>
  wire("getConversations", payload, off);

export const getMessages = (payload: any, off: boolean = false) =>
  wire("getMessages", payload, off);

export const newMessage = (payload: any, off: boolean = false) =>
  wire("newMessage", payload, off);

/** markAsRead (client -> server) */
export const markAsRead = (payload: string, off: boolean = false) =>
  wire("markAsRead", payload, off);

/** conversationUpdated (server -> client) */
export const conversationUpdated = (payload: any, off: boolean = false) =>
  wire("conversationUpdated", payload, off);

/** assistRequest (client -> server) */
export const assistRequest = (payload: any, off: boolean = false) =>
  wire("assistRequest", payload, off);

/** registerPushToken (client -> server) */
export const registerPushToken = (payload: { token: string }, off: boolean = false) =>
  wire("registerPushToken", payload, off);

/** ✅ NEW: messageDelivered (server -> client) */
export const messageDelivered = (payload: any, off: boolean = false) =>
  wire("messageDelivered", payload, off);
