import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utils/styling";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import * as Icons from "phosphor-react-native";
import MessageItem from "@/components/MessageItem";
import Input from "@/components/Input";
import * as ImagePicker from "expo-image-picker";
import Loading from "@/components/Loading";
import { uploadFileToCloudinary } from "@/services/imageService";
import { MessageProps } from "@/types";
import { getMessages, newMessage, markAsRead } from "@/socket/socketEvents";

// Shape coming from the server after populate
type ServerMessage = {
  _id: string;
  content?: string;
  attachment?: string | null;
  createdAt: string;
  senderId: {
    _id: string;
    name: string;
    avatar: string | null;
  };
  conversationId?: string;
};

const Conversation = () => {
  const { user: currentUser } = useAuth();

  const {
    id: conversationId,
    name,
    participants: stringifiedParticipants,
    avatar,
    type,
  } = useLocalSearchParams();

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ uri: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([]);

  const participants = JSON.parse(stringifiedParticipants as string);

  let conversationAvatar = avatar as string | null;
  const isDirect = type === "direct";

  const otherParticipant = isDirect
    ? participants.find((p: any) => p._id !== currentUser?.id)
    : null;

  if (isDirect && otherParticipant) {
    conversationAvatar = otherParticipant.avatar;
  }

  const conversationName = isDirect ? otherParticipant?.name : (name as string);

  // Map server message -> client MessageProps
  const toClientMessage = (m: ServerMessage): MessageProps => ({
    id: m._id,
    sender: {
      id: m.senderId?._id,
      name: m.senderId?.name,
      avatar: m.senderId?.avatar ?? null,
    },
    content: m.content ?? "",
    attachment: m.attachment ?? null,
    createdAt: m.createdAt,
    isMe: m.senderId?._id === currentUser?.id,
  });

  // Fetch history + subscribe to new
  useEffect(() => {
    const handleHistory = (res: any) => {
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((m: ServerMessage) => toClientMessage(m));
        setMessages(mapped);
      }
    };

    const handleNew = (res: any) => {
      if (res?.success && res.data) {
        const mapped = toClientMessage(res.data as ServerMessage);
        setMessages((prev) => [mapped, ...prev]); // FlatList inverted
      }
    };

    getMessages(handleHistory);
    newMessage(handleNew);
    getMessages(conversationId as string);

    return () => {
      getMessages(handleHistory, true);
      newMessage(handleNew, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUser?.id]);

  /** ===== NEW: markAsRead whenever this screen is focused ===== */
  const markCurrentAsRead = useCallback(() => {
    if (conversationId) {
      markAsRead(conversationId as string);
    }
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      markCurrentAsRead();
      return () => {};
    }, [markCurrentAsRead])
  );

  const onPickFile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setSelectedFile(result.assets[0]);
  };

  const onSend = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!currentUser) return;

    setLoading(true);
    try {
      let attachment: string | null = null;

      if (selectedFile) {
        const uploadResult = await uploadFileToCloudinary(
          selectedFile,
          "message-attachments"
        );
        if (uploadResult.success) {
          attachment = uploadResult.data as string;
        } else {
          setLoading(false);
          Alert.alert("Error", "Could not send the Image!");
          return;
        }
      }

      newMessage({
        conversationId,
        content: message.trim(),
        attachment,
      });

      setMessage("");
      setSelectedFile(null);

      // mark our own view as read (keeps unread at 0 as we send)
      markCurrentAsRead();
    } catch (error) {
      console.log("Error sending message: ", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={{ paddingTop: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* header */}
        <Header
          style={styles.header}
          leftIcon={
            <View style={styles.headerLeft}>
              <BackButton />
              <Avatar
                size={40}
                uri={conversationAvatar || null}
                isGroup={type === "group"}
              />
              <Typo
                color={colors.white}
                fontFamily="InterLight"
                fontWeight={800}
                size={20}
              >
                {conversationName}
              </Typo>
            </View>
          }
          rightIcon={
            <TouchableOpacity style={{ marginBottom: verticalScale(7) }}>
              <Icons.DotsThreeOutlineVerticalIcon
                weight="fill"
                color={colors.white}
              />
            </TouchableOpacity>
          }
        />

        {/* messages */}
        <View style={styles.content}>
          <FlatList
            data={messages}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messageContent}
            renderItem={({ item }) => (
              <MessageItem item={item} isDirect={isDirect} />
            )}
            keyExtractor={(item) => item.id}
          />

          <View style={styles.footer}>
            <Input
              value={message}
              onChangeText={setMessage}
              containerStyle={{
                paddingLeft: spacingX._10,
                paddingRight: scale(65),
                // ⬇️ added subtle rounded border (only change)
                borderWidth: 1.25,
                borderColor: colors.neutral600,
                borderRadius: 15,
                
              }}
              placeholder="Message..."
              icon={
                <TouchableOpacity style={styles.inputIcon} onPress={onPickFile}>
                  <Icons.PlusIcon
                    color={colors.black}
                    weight="bold"
                    size={verticalScale(22)}
                  />
                  {selectedFile?.uri && (
                    <Image
                      source={{ uri: selectedFile.uri }}
                      style={styles.selectedFile}
                    />
                  )}
                </TouchableOpacity>
              }
            />
            <View style={styles.inputRightIcon}>
              <TouchableOpacity style={styles.inputIcon} onPress={onSend}>
                {loading ? (
                  <Loading size="small" color={colors.black} />
                ) : (
                  <Icons.PaperPlaneTiltIcon
                    color={colors.black}
                    weight="fill"
                    size={verticalScale(22)}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Conversation;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacingX._15,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
  },
  inputRightIcon: {
    position: "absolute",
    right: scale(10),
    top: verticalScale(15),
    paddingLeft: spacingX._12,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.neutral300,
  },
  selectedFile: {
    position: "absolute",
    height: verticalScale(38),
    width: verticalScale(38),
    borderRadius: 1000,
    alignSelf: "center",
  },
  content: {
    flex: 1,
    backgroundColor: colors.black,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._15,
  },
  inputIcon: {
    backgroundColor: colors.primary,
    borderRadius: 1000,
    padding: 8,
  },
  footer: {
    paddingTop: spacingX._7,
    paddingBottom: verticalScale(22),
  },
  messageContainer: { flex: 1 },
  messageContent: {
    paddingTop: spacingY._20,
    paddingBottom: spacingY._10,
    gap: spacingY._12,
  },
  plusIcon: {
    backgroundColor: colors.primary,
    borderRadius: 1000,
    padding: 8,
  },
});
