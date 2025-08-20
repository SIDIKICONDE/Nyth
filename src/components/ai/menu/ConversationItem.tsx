import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { SavedConversation } from "../../../types/chat";
import { UIText } from "../../ui/Typography";
import { formatDate } from "./DateFormatter";

interface ConversationItemProps {
  conversation: SavedConversation;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: (conversation: SavedConversation) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onPress,
  onLongPress,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Animation au toucher
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  // Obtenir le dernier message
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const messagePreview = lastMessage
    ? (lastMessage.isUser ? t("menu.you") + ": " : "") + lastMessage.content
    : t("menu.noMessages");

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => onLongPress(conversation)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          tw`px-3 py-3 mb-2 mx-2 rounded-2xl`,
          {
            backgroundColor: isSelected
              ? currentTheme.colors.accent + "15"
              : currentTheme.isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
            borderWidth: isSelected ? 1 : 0,
            borderColor: isSelected
              ? currentTheme.colors.accent + "30"
              : "transparent",
            maxWidth: "100%",
            overflow: "hidden",
          },
        ]}
        activeOpacity={1}
      >
        <View style={[tw`flex-row items-start`, { maxWidth: "100%" }]}>
          {/* Icône de conversation */}
          <View
            style={[
              tw`w-9 h-9 rounded-full items-center justify-center mr-3`,
              {
                backgroundColor: isSelected
                  ? currentTheme.colors.accent + "20"
                  : currentTheme.isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
                flexShrink: 0,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isSelected ? "chat" : "chat-outline"}
              size={18}
              color={
                isSelected
                  ? currentTheme.colors.accent
                  : currentTheme.colors.textSecondary
              }
            />
          </View>

          {/* Contenu de la conversation */}
          <View style={[tw`flex-1`, { minWidth: 0 }]}>
            <View
              style={[
                tw`flex-row justify-between items-start mb-1`,
                { maxWidth: "100%" },
              ]}
            >
              <UIText
                size="base"
                weight="semibold"
                style={[
                  {
                    color: isSelected
                      ? currentTheme.colors.accent
                      : currentTheme.colors.text,
                    flex: 1,
                    marginRight: 8,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {conversation.title}
              </UIText>
              <UIText
                size="xs"
                style={[
                  {
                    color: currentTheme.colors.textSecondary,
                    opacity: 0.7,
                    flexShrink: 0,
                  },
                ]}
              >
                {formatDate(conversation.lastUpdated, t)}
              </UIText>
            </View>

            <UIText
              size="sm"
              style={[
                {
                  color: currentTheme.colors.textSecondary,
                  opacity: 0.8,
                },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {messagePreview}
            </UIText>

            {/* Indicateur de messages */}
            {conversation.messages.length > 0 && (
              <View
                style={[tw`flex-row items-center mt-1.5`, { maxWidth: "100%" }]}
              >
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={12}
                  color={currentTheme.colors.textSecondary}
                  style={{ opacity: 0.5, flexShrink: 0 }}
                />
                <UIText
                  size="xs"
                  style={[
                    tw`ml-1`,
                    {
                      color: currentTheme.colors.textSecondary,
                      opacity: 0.5,
                      flexShrink: 0,
                    },
                  ]}
                >
                  {conversation.messages.length} {t("menu.messages")}
                </UIText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ConversationItem;
