// client/ constants/ index.ts
//import { Platform } from "react-native";
//export const API_URL = Platform.OS === 'android'? 'http://10.74.255.123:3000':"http://localhost:3000";

import { Platform } from "react-native";

export const API_URL = Platform.select({
   //android: "http://10.74.255.123:3000", //laptop
 android: "http://localhost:3000", //USB DEBUGGING
  ios: "http://localhost:3000",
  default: "http://localhost:3000",
});

export const CLOUDINARY_CLOUD_NAME = "cjblackdev";
export const CLOUDINARY_UPLOAD_PRESET = "Images";