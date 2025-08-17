import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type ConversationListViewType = "sections" | "cards" | "ios";

const CONVERSATION_VIEW_KEY = "@conversation_list_view";

export const useConversationListView = () => {
  const [viewType, setViewType] = useState<ConversationListViewType>("ios");
  const [isLoading, setIsLoading] = useState(true);

  // Charger la préférence sauvegardée
  useEffect(() => {
    const loadViewPreference = async () => {
      try {
        const savedView = await AsyncStorage.getItem(CONVERSATION_VIEW_KEY);

        if (
          savedView &&
          (savedView === "sections" ||
            savedView === "cards" ||
            savedView === "ios")
        ) {
          setViewType(savedView as ConversationListViewType);
        } else {
          setViewType("ios");
        }
      } catch (error) {
        setViewType("ios");
      } finally {
        setIsLoading(false);
      }
    };

    loadViewPreference();
  }, []);

  // Debug pour surveiller les changements de viewType
  useEffect(() => {}, [viewType]);

  // Changer le type de vue et sauvegarder
  const changeViewType = useCallback(
    async (newViewType: ConversationListViewType) => {
      try {
        if (newViewType === viewType) {
          return;
        }

        // Valider le nouveau type
        if (!["sections", "cards", "ios"].includes(newViewType)) {
          return;
        }

        // Mettre à jour l'état
        setViewType(newViewType);

        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem(CONVERSATION_VIEW_KEY, newViewType);

        // Vérifier que la sauvegarde a fonctionné
        const verification = await AsyncStorage.getItem(CONVERSATION_VIEW_KEY);
      } catch (error) {}
    },
    [viewType]
  );

  // Basculer entre les vues
  const toggleView = useCallback(() => {
    const viewTypes: ConversationListViewType[] = ["sections", "cards", "ios"];
    const currentIndex = viewTypes.indexOf(viewType);
    const nextIndex = (currentIndex + 1) % viewTypes.length;
    const nextViewType = viewTypes[nextIndex];

    changeViewType(nextViewType);
  }, [viewType, changeViewType]);

  // Fonction de debug pour forcer un type de vue
  const forceViewType = useCallback(
    async (forcedType: ConversationListViewType) => {
      try {
        await AsyncStorage.setItem(CONVERSATION_VIEW_KEY, forcedType);
        setViewType(forcedType);
      } catch (error) {}
    },
    []
  );

  // Fonction de debug pour vider le cache
  const clearViewPreference = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CONVERSATION_VIEW_KEY);
      setViewType("ios");
    } catch (error) {}
  }, []);

  return {
    viewType,
    changeViewType,
    toggleView,
    isLoading,
    // Fonctions de debug
    forceViewType,
    clearViewPreference,
  };
};
