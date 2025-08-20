import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Clipboard, Share } from "react-native";
import { SavedConversation } from "../../../types/chat";

// Type pour la fonction de traduction
type TranslationFunction = (key: string, options?: any) => string;

/**
 * Copier le contenu d'une conversation dans le presse-papiers
 */
export const copyConversationContent = (
  conversation: SavedConversation,
  t: TranslationFunction
): void => {
  if (!conversation) return;

  // Créer un résumé du contenu de la conversation
  const summary = conversation.messages
    .map(
      (msg) =>
        `${msg.isUser ? t("menu.you") : t("menu.ai")}: ${msg.content.substring(
          0,
          100
        )}${msg.content.length > 100 ? "..." : ""}`
    )
    .join("\n\n");

  Clipboard.setString(summary);
  Alert.alert(t("menu.copied"), t("menu.conversationCopied"));
};

/**
 * Partager une conversation
 */
export const shareConversation = async (
  conversation: SavedConversation,
  t: TranslationFunction
): Promise<void> => {
  if (!conversation) return;

  try {
    // Créer un résumé du contenu de la conversation
    const title = conversation.title;
    const summary = conversation.messages
      .map(
        (msg) => `${msg.isUser ? t("menu.you") : t("menu.ai")}: ${msg.content}`
      )
      .join("\n\n");

    await Share.share({
      title: t("menu.shareConversation", { title }),
      message: summary,
    });
  } catch (error) {
    Alert.alert(t("common.error"), t("menu.shareError"));
  }
};

/**
 * Renommer une conversation
 */
export const renameConversation = (
  conversation: SavedConversation,
  onSuccess: () => void,
  t: TranslationFunction
): void => {
  if (!conversation) return;

  Alert.prompt(
    t("menu.renameTitle"),
    t("menu.renamePrompt"),
    [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("menu.rename"),
        onPress: async (newTitle?: string) => {
          if (newTitle && newTitle.trim()) {
            try {
              const savedConversationsJson = await AsyncStorage.getItem(
                "ai_conversations"
              );

              if (savedConversationsJson) {
                const savedConversations: SavedConversation[] = JSON.parse(
                  savedConversationsJson
                );

                // Trouver et mettre à jour la conversation
                const updatedConversations = savedConversations.map((conv) => {
                  if (conv.id === conversation.id) {
                    return { ...conv, title: newTitle.trim() };
                  }
                  return conv;
                });

                // Sauvegarder les conversations mises à jour
                await AsyncStorage.setItem(
                  "ai_conversations",
                  JSON.stringify(updatedConversations)
                );

                // Notifier du succès
                onSuccess();
              }
            } catch (error) {
              Alert.alert(t("common.error"), t("menu.renameError"));
            }
          }
        },
      },
    ],
    "plain-text",
    conversation.title
  );
};
