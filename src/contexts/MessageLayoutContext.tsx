import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('MessageLayoutContext');

export interface MessageLayoutSettings {
  messageWidth: number; // Pourcentage de largeur (60-95%)
  messageHeight: number; // Facteur de hauteur (0.8-1.5)
  messageGap: number; // Espacement entre messages en pixels (8-32px)
  paddingHorizontal: number; // Padding horizontal (8-24px)
  paddingVertical: number; // Padding vertical (8-20px)
}

interface MessageLayoutContextType {
  settings: MessageLayoutSettings;
  updateSettings: (
    newSettings: Partial<MessageLayoutSettings>
  ) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const defaultSettings: MessageLayoutSettings = {
  messageWidth: 85, // 85% par défaut
  messageHeight: 1.0, // Hauteur normale
  messageGap: 12, // 12px d'espacement
  paddingHorizontal: 16, // 16px de padding horizontal
  paddingVertical: 12, // 12px de padding vertical
};

const MessageLayoutContext = createContext<MessageLayoutContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  resetToDefaults: async () => {},
});

export const useMessageLayout = () => {
  const context = useContext(MessageLayoutContext);
  if (!context) {
    throw new Error(
      "useMessageLayout must be used within a MessageLayoutProvider"
    );
  }
  return context;
};

export const MessageLayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] =
    useState<MessageLayoutSettings>(defaultSettings);

  // Charger les préférences au démarrage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(
        "@message_layout_settings"
      );
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des réglages de layout:", error);
    }
  };

  const updateSettings = async (
    newSettings: Partial<MessageLayoutSettings>
  ) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(
        "@message_layout_settings",
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      logger.error(
        "Erreur lors de la sauvegarde des réglages de layout:",
        error
      );
    }
  };

  const resetToDefaults = async () => {
    try {
      setSettings(defaultSettings);
      await AsyncStorage.setItem(
        "@message_layout_settings",
        JSON.stringify(defaultSettings)
      );
    } catch (error) {
      logger.error(
        "Erreur lors de la réinitialisation des réglages de layout:",
        error
      );
    }
  };

  return (
    <MessageLayoutContext.Provider
      value={{ settings, updateSettings, resetToDefaults }}
    >
      {children}
    </MessageLayoutContext.Provider>
  );
};
