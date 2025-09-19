// client/app/components/ConversationItem.tsx
import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import { colors, spacingX, spacingY } from "@/constants/theme";
import Avatar from "./Avatar";
import Typo from "./Typo";
import moment from "moment";
import { ConversationListItemProps } from "@/types";
import { useAuth } from "@/contexts/authContext";

const ConversationItem = ({ item, showDivider, router }: ConversationListItemProps) => {
  const { user: currentUser } = useAuth();

  const lastMessage: any = item.lastMessage;
  const isDirect = item.type === "direct";
  let avatar = item.avatar;
  const otherParticipants = isDirect
    ? item.participants.find((p) => p._id !== currentUser?.id)
    : null;
  if (isDirect && otherParticipants) avatar = otherParticipants?.avatar;

  const unreadCount = Number((item as any).unreadCount ?? 0);

  const getLastMessageContent = () => {
    if (!lastMessage) return "Say hi";
    return lastMessage?.attachment ? "Image" : lastMessage.content;
  };

  const getLastMessageDate = () => {
    if (!lastMessage?.createdAt) return null;

    const messageDate = moment(lastMessage.createdAt);
    const now = moment();

    if (now.diff(messageDate, "minutes") < 1) return "now";
    if (messageDate.isSame(now, "day")) return messageDate.format("h:mm A");
    if (messageDate.isSame(now, "year")) return messageDate.format("MMM D");
    return messageDate.format("MMM D, YYYY");
  };

  const openConversation = () => {
    router.push({
      pathname: "/(main)/conversation",
      params: {
        id: item._id,
        name: item.name,
        avatar: item.avatar,
        type: item.type,
        participants: JSON.stringify(item.participants),
      },
    });
  };

  const timeLabel = getLastMessageDate();

  return (
    <View>
      <TouchableOpacity style={styles.conversationItem} onPress={openConversation}>
        <Avatar uri={avatar} size={47} isGroup={item.type === "group"} />

        <View style={{ flex: 1 }}>
          {/* Top row: name (left) • time + dot (right) */}
          <View style={styles.row}>
            <Typo
              size={17}
              fontWeight={"800"}
              color={colors.neutral100}
              style={styles.nameText}
            >
              {isDirect ? otherParticipants?.name : item?.name}
            </Typo>

            <View style={styles.rightMeta}>
              {timeLabel ? (
                <Typo
                  size={13}
                  color={colors.neutral200}
                  fontFamily="InterLight"
                  style={styles.timeText}
                >
                  {timeLabel}
                </Typo>
              ) : null}
              {unreadCount > 0 && <View style={styles.dot} />}
            </View>
          </View>

          {/* Bottom line: either "X new…" or preview */}
          {unreadCount > 0 ? (
            <Typo size={15} color={colors.green} fontFamily="InterLight"  style={{ marginTop: -10 }} >
              {unreadCount === 1 ? "1 new message" : `${unreadCount} new messages`}
            </Typo>
          ) : (
            <Typo
              size={15}
              color={colors.neutral400}
              textProps={{ numberOfLines: 1 }}
              fontFamily="InterLight"
            >
              {getLastMessageContent()}
            </Typo>
          )}
        </View>
      </TouchableOpacity>

      {showDivider && <View style={styles.divider} />}
    </View>
  );
};

export default ConversationItem;

const styles = StyleSheet.create({
  conversationItem: {
    gap: spacingX._12,
    marginVertical: spacingY._12,
    flexDirection: "row",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",   // ⬅️ align name with top of time
    justifyContent: "space-between",
  },
  rightMeta: {
    flexDirection: "column",    // time on top, dot below
    alignItems: "flex-end",
  },
  nameText: {
    includeFontPadding: false,  // tighter top padding (Android)
    lineHeight: 20,
  },
  timeText: {
    includeFontPadding: false,  // matches baseline better
    lineHeight: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
    marginTop: 6,               // below the time
    alignSelf: "center",
  },
  divider: {
    height: 1,
    width: "95%",
    alignSelf: "center",
    backgroundColor: "rgba(47, 43, 43, 1)",
  },
});
