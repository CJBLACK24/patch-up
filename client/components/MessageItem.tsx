// client/components/MessageItem.tsx

import { StyleSheet, View, Image } from "react-native";
import React from "react";
import { MessageProps } from "@/types";
import { useAuth } from "@/contexts/authContext";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Avatar from "./Avatar";
import Typo from "./Typo";
import Animated, { SlideInLeft, SlideInRight } from "react-native-reanimated";

const formatTime = (val: string) => {
  if (!val) return "";
  // If already in "1:00 PM" style, keep it
  if (/\d{1,2}:\d{2}\s?(AM|PM)/i.test(val)) return val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return val;
};

const MessageItem = ({
  item,
  isDirect,
}: {
  item: MessageProps;
  isDirect: boolean;
}) => {
  const { user: currentUser } = useAuth();
  const isMe = item.isMe;

  return (
    <Animated.View
      entering={(isMe ? SlideInRight : SlideInLeft).duration(200).delay(50)}
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      {/* Show avatar for all incoming messages (direct & group) */}
      {!isMe && (
        <Avatar
          size={30}
          uri={item.sender?.avatar || null}
          style={styles.messageAvatar}
        />
      )}

      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.theirBubble,
        ]}
      >
        {/* In group chats, show sender name for non-me messages */}
        {!isMe && !isDirect && (
          <Typo color={colors.neutral900} fontWeight={"600"} size={13}>
            {item.sender.name}
          </Typo>
        )}

        {/* Attachment (image) */}
        {item.attachment ? (
          <Image
            source={{ uri: item.attachment }}
            style={styles.attachment}
            resizeMode="cover"
          />
        ) : null}

        {/* Text */}
        {item.content && <Typo size={15}>{item.content}</Typo>}

        {/* Time (e.g., 1:00 PM) */}
        <Typo
          style={{ alignSelf: "flex-end" }}
          size={11}
          fontWeight={"500"}
          color={colors.neutral600}
        >
          {formatTime(item.createdAt)}
        </Typo>
      </View>
    </Animated.View>
  );
};

export default MessageItem;

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    gap: spacingX._7,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    alignSelf: "flex-end",
  },
  attachment: {
    height: verticalScale(180),
    width: verticalScale(180),
    borderRadius: radius._10,
    marginBottom: spacingY._5,
  },
  messageBubble: {
    padding: spacingX._10,
    borderRadius: radius._15,
    gap: spacingY._5,
  },
  myBubble: {
    backgroundColor: colors.myBubble,
  },
  theirBubble: {
    backgroundColor: colors.otherBubble,
  },
});
