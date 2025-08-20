import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ChatStyleId =
  | "classic"
  | "minimal"
  | "neon"
  | "modern"
  | "elegant"
  | "retro"
  | "glass"
  | "ios"
  | "gradient"
  | "terminal"
  | "chatgpt";

interface ChatStyleContextType {
  selectedStyle: ChatStyleId;
  setSelectedStyle: (style: ChatStyleId) => void;
}

const ChatStyleContext = createContext<ChatStyleContextType>({
  selectedStyle: "classic",
  setSelectedStyle: () => {},
});

export const ChatStyleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedStyle, setSelectedStyleState] =
    useState<ChatStyleId>("classic");

  // Charger le style enregistré
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("@chat_style");
        const validStyles: ChatStyleId[] = [
          "classic",
          "minimal",
          "neon",
          "modern",
          "elegant",
          "retro",
          "glass",
          "ios",
          "gradient",
          "terminal",
          "chatgpt",
        ];
        if (saved && validStyles.includes(saved as ChatStyleId)) {
          setSelectedStyleState(saved as ChatStyleId);
        }
      } catch (error) {
        // Silencieux en cas d'échec
      }
    })();
  }, []);

  // Mettre à jour et persister
  const setSelectedStyle = (style: ChatStyleId) => {
    setSelectedStyleState(style);
    AsyncStorage.setItem("@chat_style", style).catch(() => {});
  };

  return (
    <ChatStyleContext.Provider value={{ selectedStyle, setSelectedStyle }}>
      {children}
    </ChatStyleContext.Provider>
  );
};

export const useChatStyle = () => useContext(ChatStyleContext);
