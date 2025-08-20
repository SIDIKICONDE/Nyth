import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { SavedConversation } from "../../../types/chat";
import { UIText } from "../../ui/Typography";

interface ContextMenuProps {
  visible: boolean;
  conversation: SavedConversation | null;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  conversation,
  onCopy,
  onShare,
  onDelete,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible || !conversation) return null;

  const ActionButton = ({
    icon,
    label,
    onPress,
    color = currentTheme.colors.accent,
    destructive = false,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        tw`flex-row items-center p-4 rounded-2xl`,
        {
          backgroundColor: destructive
            ? "rgba(239, 68, 68, 0.1)"
            : currentTheme.isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.03)",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
          {
            backgroundColor: destructive
              ? "rgba(239, 68, 68, 0.15)"
              : color + "15",
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={destructive ? "#ef4444" : color}
        />
      </View>
      <UIText
        size="base"
        weight="medium"
        style={[
          tw`flex-1`,
          { color: destructive ? "#ef4444" : currentTheme.colors.text },
        ]}
      >
        {label}
      </UIText>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={currentTheme.colors.textSecondary}
        style={{ opacity: 0.5 }}
      />
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          tw`items-center justify-center px-6`,
          { opacity: opacityAnim },
        ]}
      >
        {/* Overlay avec effet de flou */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(0, 0, 0, 0.8)"
                : "rgba(0, 0, 0, 0.5)",
              opacity: opacityAnim,
            },
          ]}
        />

        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              tw`rounded-3xl w-full max-w-sm overflow-hidden`,
              {
                backgroundColor: currentTheme.isDark
                  ? "rgba(30, 30, 30, 0.98)"
                  : "rgba(255, 255, 255, 0.98)",
                transform: [{ scale: scaleAnim }],
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 20,
              },
            ]}
          >
            {/* En-tête avec titre de la conversation */}
            <View
              style={[
                tw`px-6 py-4 border-b`,
                { borderColor: currentTheme.colors.border + "20" },
              ]}
            >
              <UIText
                size="lg"
                weight="bold"
                style={[tw`text-center`, { color: currentTheme.colors.text }]}
                numberOfLines={1}
              >
                {conversation.title}
              </UIText>
              <UIText
                size="xs"
                style={[
                  tw`text-center mt-1`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {conversation.messages.length} {t("menu.messages")}
              </UIText>
            </View>

            {/* Aperçu du contenu */}
            {conversation.messages.length > 0 && (
              <View
                style={[
                  tw`mx-6 my-4 p-4 rounded-2xl`,
                  {
                    backgroundColor: currentTheme.isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                    maxHeight: 150,
                  },
                ]}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={tw`flex-1`}
                >
                  {conversation.messages.slice(0, 3).map((msg, index) => (
                    <View key={index} style={tw`${index > 0 ? "mt-3" : ""}`}>
                      <UIText
                        size="xs"
                        weight="semibold"
                        style={[
                          tw`mb-1`,
                          {
                            color: msg.isUser
                              ? currentTheme.colors.accent
                              : currentTheme.colors.primary,
                          },
                        ]}
                      >
                        {msg.isUser ? t("menu.you") : "AI"}
                      </UIText>
                      <UIText
                        size="sm"
                        style={[{ color: currentTheme.colors.textSecondary }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {msg.content}
                      </UIText>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Actions */}
            <View style={tw`px-6 pb-6`}>
              <View style={tw`mb-2`}>
                <ActionButton
                  icon="content-copy"
                  label={t("menu.copy")}
                  onPress={onCopy}
                />
              </View>

              <View style={tw`mb-2`}>
                <ActionButton
                  icon="share-variant"
                  label={t("menu.share")}
                  onPress={onShare}
                />
              </View>

              <View>
                <ActionButton
                  icon="delete-outline"
                  label={t("menu.delete")}
                  onPress={onDelete}
                  destructive
                />
              </View>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default ContextMenu;
