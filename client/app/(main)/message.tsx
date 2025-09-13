// client/(main)/message.tsx

import { ScrollView, StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import { useRouter } from "expo-router";
import Loading from "@/components/Loading";
import Button from "@/components/Button";
import ConversationItem from "@/components/ConversationItem";
import { getConversations, newConversation } from "@/socket/socketEvents";
import { ConversationProps, ResponseProps } from "@/types";

const Message = () => {
  const { signOut } = useAuth();
  const router = useRouter();

  // keep your original state & sockets logic
  const [selectedTab, setSelectedTab] = useState(0); // unused visually, preserved
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationProps[]>([]);

  useEffect(() => {
    getConversations(processConversations);
    newConversation(newConversationHandler);

    getConversations(null);

    return () => {
      getConversations(processConversations, true);
      newConversation(newConversationHandler, true);
    };
  }, []);

  const processConversations = (res: ResponseProps) => {
    if (res.success) setConversations(res.data);
  };

  const newConversationHandler = (res: ResponseProps) => {
    if (res.success && res.data?.isNew) {
      setConversations((prev) => [...prev, res.data]);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  // keep your per-type sorting, then show a single combined "Chats" feed
  let directConversation = conversations
    .filter((item: ConversationProps) => item.type === "direct")
    .sort((a, b) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  let groupConversation = conversations
    .filter((item: ConversationProps) => item.type === "group")
    .sort((a, b) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const allConversations = [...directConversation, ...groupConversation].sort(
    (a, b) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    }
  );

  return (
    <ScreenWrapper style={{ paddingTop: 0, backgroundColor: "#121217" }}>
      <View style={styles.container}>
        {/* top bar with brand + title */}
        <View style={styles.topBar}>
          {/* Left stacked brand */}
          <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
            {/* patch up */}
            <Typo size={22} fontWeight="800">
              <Typo size={30} fontWeight="800" color={colors.primary}>
                patch
              </Typo>{" "}
              <Typo size={30} fontWeight="800" color={colors.white}>
                up
              </Typo>
            </Typo>

            {/* Chats below */}
            <Typo
              size={20}
              fontWeight="800"
              color={colors.white}
              style={{ marginTop: 15 }}
            >
              Chats
            </Typo>
          </View>

          {/* Floating button right */}
          <Button
            style={styles.floatingButton}
            onPress={() =>
              router.push({
                pathname: "/(main)/newConversationModal",
                params: { isGroup: 0 },
              })
            }
          >
            <Icons.PlusIcon
              color={"#121217"}
              weight="bold"
              size={verticalScale(24)}
            />
          </Button>
        </View>

        <View style={styles.content}>
          <ScrollView
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: spacingY._10 }}
          >
            <View style={styles.conversationList}>
              {allConversations.map((item: ConversationProps, index) => (
                <View key={index}>
                  <ConversationItem
                    item={item}
                    router={router}
                    showDivider={false} // we'll draw our own divider to match the screenshot
                  />
                  {index !== allConversations.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>

            {!loading && allConversations.length === 0 && (
              <Typo
                color={colors.white}
                style={{ textAlign: "center", marginTop: spacingY._20 }}
              >
                No chats yet
              </Typo>
            )}

            {loading && <Loading />}
          </ScrollView>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Message;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D", // dark like the screenshot
  },
  topBar: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._10,
  },
  content: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    paddingHorizontal: spacingX._15,
  },
  conversationList: {
    paddingVertical: spacingY._10,
  },
  divider: {
    height: 1,
    backgroundColor: "#2B2D31", 
    marginVertical: 8,
  },
  floatingButton: {
    height: verticalScale(30),
    width: verticalScale(30),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(10),
    right: verticalScale(30),
    backgroundColor: colors.white,
  },
});
