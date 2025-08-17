import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as React from "react";
import { useEffect, useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useTranslation } from "../../hooks/useTranslation";

import { AIConnectionService } from "../../services/chat/aiConnectionService";
import { Message } from "../../types/chat";
import { RootStackParamList } from "../../types/navigation";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('ConversationManager');

interface ConversationManagerProps {
  children: (props: {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    conversationId: string;
    loadConversation: (id?: string) => Promise<boolean>;
    startNewConversation: () => void;
    checkAiConnection: () => Promise<void>;
    saveActiveConversationId: (id: string) => Promise<void>;
    newMessageIds: Set<string>;
    setNewMessageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  }) => React.ReactNode;
}

type NavigationProp = StackNavigationProp<RootStackParamList, "AIChat">;

const ConversationManager: React.FC<ConversationManagerProps> = ({
  children,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const {
    messages,
    setMessages,
    conversationId,
    loadConversation,
    startNewConversation,
    isLoaded,
  } = useChat();

  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check the AI connection
  const checkAiConnection = async (): Promise<void> => {
    try {
      const hasSeenWelcomeMessage = await AsyncStorage.getItem(
        "has_seen_welcome_message"
      );

      const result = await AIConnectionService.checkAiConnection();

      if (messages.length === 0) {
        if (result.status === "connected" && hasSeenWelcomeMessage !== "true") {
          setMessages([
            {
              id: "0",
              content: result.initialMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          await AsyncStorage.setItem("has_seen_welcome_message", "true");
        } else if (
          result.status !== "connected" ||
          hasSeenWelcomeMessage !== "true"
        ) {
          setMessages([
            {
              id: "0",
              content: result.initialMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      logger.error(t("conversation.manager.errors.checkingConnection"), error);
    }
  };

  // Save active conversation ID (pour compatibilité)
  const saveActiveConversationId = async (id: string) => {
    // Déjà géré par le ChatContext
  };

  // Initialisation une seule fois
  useEffect(() => {
    if (isLoaded && !hasInitialized) {
      const initializeChat = async () => {
        // Vérifier s'il faut charger une conversation spécifique depuis les params
        const params = navigation
          .getState()
          .routes.find((r) => r.name === "AIChat")?.params as
          | { conversationId?: string }
          | undefined;

        if (
          params?.conversationId &&
          params.conversationId !== conversationId
        ) {
          await loadConversation(params.conversationId);
        } else if (messages.length === 0) {
          // Seulement vérifier la connexion AI si pas de messages
          await checkAiConnection();
        }

        setHasInitialized(true);
      };

      initializeChat();
    }
  }, [isLoaded, hasInitialized]);

  return (
    <>
      {children({
        messages,
        setMessages,
        conversationId,
        loadConversation,
        startNewConversation,
        checkAiConnection,
        saveActiveConversationId,
        newMessageIds,
        setNewMessageIds,
      })}
    </>
  );
};

export default ConversationManager;
