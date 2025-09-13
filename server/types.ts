// server/types.ts

import { Document, Types } from "mongoose";

export interface UserProps extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name?: string;
  avatar?: string;
  created?: Date;
  phone?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

export interface ConversationProps extends Document {
  _id: Types.ObjectId;
  type: "direct" | "group";
  name?: string;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

