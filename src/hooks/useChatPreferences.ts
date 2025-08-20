import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const CHAT_PREFERENCES_KEY = "@chat_preferences";

interface ChatPreferences {
  autoScrollEnabled: boolean;
}

const defaultPreferences: ChatPreferences = {
  autoScrollEnabled: true, // ✅ Activé par défaut
};

export const useChatPreferences = () => {
  const [preferences, setPreferences] =
    useState<ChatPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {} finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<ChatPreferences>) => {
    try {
      const updated = { ...preferences, ...newPreferences };
      await AsyncStorage.setItem(CHAT_PREFERENCES_KEY, JSON.stringify(updated));
      setPreferences(updated);
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggleAutoScroll = async () => {
    return savePreferences({
      autoScrollEnabled: !preferences.autoScrollEnabled,
    });
  };

  return {
    preferences,
    isLoading,
    savePreferences,
    toggleAutoScroll,
  };
};
