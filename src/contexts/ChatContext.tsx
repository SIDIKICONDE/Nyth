import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ConversationService } from "../services/chat/conversationService";
import { Message } from "../types/chat";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('ChatContext');

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  conversationId: string;
  setConversationId: React.Dispatch<React.SetStateAction<string>>;
  isLoaded: boolean;
  loadConversation: (id?: string) => Promise<boolean>;
  startNewConversation: () => void;
  saveCurrentConversation: () => Promise<void>;
  autoLoadEnabled: boolean;
  toggleAutoLoad: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LAST_ACTIVE_CONVERSATION_KEY = "last_active_conversation_id";
const AUTO_LOAD_LAST_CONVERSATION_KEY = "auto_load_last_conversation";

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>(
    Date.now().toString()
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false);

  // Sauvegarder la conversation actuelle
  const saveCurrentConversation = async () => {
    try {
      if (messages.length > 0) {
        await ConversationService.saveConversation(conversationId, messages);
        await AsyncStorage.setItem(
          LAST_ACTIVE_CONVERSATION_KEY,
          conversationId
        );
      }
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde de la conversation:", error);
      // Ne pas propager l'erreur pour éviter de bloquer d'autres opérations
    }
  };

  // Charger une conversation
  const loadConversation = async (id?: string): Promise<boolean> => {
    try {
      const result = await ConversationService.loadConversation(id);
      setMessages(result.messages);
      setConversationId(result.conversationId);
      await AsyncStorage.setItem(
        LAST_ACTIVE_CONVERSATION_KEY,
        result.conversationId
      );
      return result.messages.length > 0;
    } catch (error) {
      logger.error("Erreur lors du chargement de la conversation:", error);
      return false;
    }
  };

  // Démarrer une nouvelle conversation
  const startNewConversation = async () => {
    try {
      // Sauvegarder la conversation actuelle seulement si elle a des messages
      if (messages.length > 0) {
        await saveCurrentConversation();
      }

      const newId = Date.now().toString();
      setConversationId(newId);
      setMessages([]);
      await AsyncStorage.setItem(LAST_ACTIVE_CONVERSATION_KEY, newId);
    } catch (error) {
      logger.error(
        "Erreur lors de la création d'une nouvelle conversation:",
        error
      );
      // En cas d'erreur, créer quand même une nouvelle conversation
      const newId = Date.now().toString();
      setConversationId(newId);
      setMessages([]);
    }
  };

  // Charger la dernière conversation au démarrage
  useEffect(() => {
    const loadLastConversation = async () => {
      if (!isLoaded) {
        // Vérifier si le chargement automatique est activé
        const autoLoadSetting = await AsyncStorage.getItem(
          AUTO_LOAD_LAST_CONVERSATION_KEY
        );
        const shouldAutoLoad = autoLoadSetting === "true"; // Par défaut false

        if (shouldAutoLoad) {
          const lastId = await AsyncStorage.getItem(
            LAST_ACTIVE_CONVERSATION_KEY
          );
          if (lastId) {
            await loadConversation(lastId);
          }
        }
        setAutoLoadEnabled(shouldAutoLoad);
        setIsLoaded(true);
      }
    };
    loadLastConversation();
  }, []);

  // Sauvegarder automatiquement quand les messages changent
  useEffect(() => {
    if (messages.length > 0 && isLoaded) {
      saveCurrentConversation();
    }
  }, [messages, conversationId]);

  const toggleAutoLoad = async () => {
    try {
      const newAutoLoadSetting = !autoLoadEnabled;
      logger.debug(
        "🔄 Toggling autoLoad from",
        autoLoadEnabled,
        "to",
        newAutoLoadSetting
      );
      await AsyncStorage.setItem(
        AUTO_LOAD_LAST_CONVERSATION_KEY,
        newAutoLoadSetting ? "true" : "false"
      );
      setAutoLoadEnabled(newAutoLoadSetting);
    } catch (error) {
      logger.error(
        "Erreur lors de la bascule du chargement automatique:",
        error
      );
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        conversationId,
        setConversationId,
        isLoaded,
        loadConversation,
        startNewConversation,
        saveCurrentConversation,
        autoLoadEnabled,
        toggleAutoLoad,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
