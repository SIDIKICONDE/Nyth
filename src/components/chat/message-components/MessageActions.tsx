import React from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Clipboard } from "react-native";

interface MessageActionsProps {
  isVisible: boolean;
  isUser: boolean;
  messageContent: string;
  messageId: string;
  onSaveToEditor: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onClose: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  isVisible,
  isUser,
  messageContent,
  messageId,
  onSaveToEditor,
  onEditMessage,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  if (!isVisible) return null;

  const handleCopy = () => {
    if (messageContent) {
      Clipboard.setString(messageContent);
      Alert.alert(
        t("chat.message.copied", "Copied"),
        t("chat.message.copiedToClipboard", "Text copied to clipboard"),
        [{ text: t("common.ok", "OK") }]
      );
    }
  };

  const handleSaveToEditor = () => {
    if (messageContent && !isUser) {
      onSaveToEditor(messageContent);
      onClose();
    }
  };

  const handleEdit = () => {
    Alert.alert(
      t("chat.message.editTitle", "Edit Message"),
      t("chat.message.editPrompt", "Do you want to edit this message?"),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("chat.message.edit", "Edit"),
          onPress: () => onEditMessage?.(messageId, messageContent),
        },
      ]
    );
  };

  return (
    <>
      <View
        style={[
          tw`absolute right-4 top-12 flex-row bg-white rounded-xl p-2`,
          {
            backgroundColor: currentTheme.isDark ? "#3C3C3E" : "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            zIndex: 1000,
          },
        ]}
      >
        <TouchableOpacity
          style={tw`p-3 items-center justify-center`}
          onPress={handleCopy}
        >
          <Ionicons
            name="copy-outline"
            size={20}
            color={currentTheme.colors.text}
          />
        </TouchableOpacity>

        {isUser && (
          <TouchableOpacity
            style={tw`p-3 items-center justify-center ml-2`}
            onPress={handleEdit}
          >
            <Ionicons
              name="pencil-outline"
              size={20}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>
        )}

        {!isUser && (
          <TouchableOpacity
            style={tw`p-3 items-center justify-center ml-2`}
            onPress={handleSaveToEditor}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[tw`absolute inset-0`, { zIndex: 999 }]}
        onPress={onClose}
        activeOpacity={1}
      />
    </>
  );
};
