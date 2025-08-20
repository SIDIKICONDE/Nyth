import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('ConversationViewContext');

export type ConversationListViewType = "sections" | "cards" | "ios";

interface ConversationViewContextType {
  viewType: ConversationListViewType;
  changeViewType: (newViewType: ConversationListViewType) => Promise<void>;
  isLoading: boolean;
}

const ConversationViewContext = createContext<
  ConversationViewContextType | undefined
>(undefined);

const CONVERSATION_VIEW_KEY = "@conversation_list_view";

export const ConversationViewProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [viewType, setViewType] = useState<ConversationListViewType>("ios");
  const [isLoading, setIsLoading] = useState(true);

  // Charger la préférence sauvegardée
  useEffect(() => {
    const loadViewPreference = async () => {
      try {
        logger.debug("🔄 ConversationViewContext - Loading preference...");
        const savedView = await AsyncStorage.getItem(CONVERSATION_VIEW_KEY);
        logger.debug("📱 ConversationViewContext - Saved view:", savedView);

        if (savedView && ["sections", "cards", "ios"].includes(savedView)) {
          logger.debug(
            "✅ ConversationViewContext - Setting view type to:",
            savedView
          );
          setViewType(savedView as ConversationListViewType);
        }
      } catch (error) {
        logger.warn(
          "❌ ConversationViewContext - Error loading preference:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadViewPreference();
  }, []);

  // Changer le type de vue et sauvegarder
  const changeViewType = useCallback(
    async (newViewType: ConversationListViewType) => {
      try {
        logger.debug(
          "🔄 ConversationViewContext - Changing view type to:",
          newViewType
        );

        if (newViewType === viewType) {
          logger.debug("⚠️ ConversationViewContext - Same view type, skipping");
          return;
        }

        // Mettre à jour l'état
        setViewType(newViewType);

        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem(CONVERSATION_VIEW_KEY, newViewType);
        logger.debug(
          "💾 ConversationViewContext - Saved to AsyncStorage:",
          newViewType
        );
      } catch (error) {
        logger.error(
          "❌ ConversationViewContext - Error saving preference:",
          error
        );
      }
    },
    [viewType]
  );

  return (
    <ConversationViewContext.Provider
      value={{ viewType, changeViewType, isLoading }}
    >
      {children}
    </ConversationViewContext.Provider>
  );
};

export const useConversationView = () => {
  const context = useContext(ConversationViewContext);
  if (!context) {
    throw new Error(
      "useConversationView must be used within a ConversationViewProvider"
    );
  }
  return context;
};
