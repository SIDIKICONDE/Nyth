import { processFormattedText } from "@/utils/textFormatter";
import React from "react";
import { StyleProp, TextStyle, View } from "react-native";

interface FormattedMessageProps {
  text: string;
  style?: StyleProp<TextStyle>;
  isComplete?: boolean;
}

/**
 * Composant pour afficher des messages avec formatage markdown
 * Utilise le système de formatage existant de textFormatting.tsx
 */
export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  text,
  style = {},
  isComplete = true,
}) => {
  if (!text) return null;

  return <View>{processFormattedText(text, style, isComplete)}</View>;
};

/**
 * Version simplifiée pour les toasts - nettoie le markdown
 */
export const cleanMarkdownForToast = (text: string): string => {
  if (!text) return text;

  return (
    text
      // Supprimer les caractères de formatage markdown
      .replace(/\*\*\*(.*?)\*\*\*/g, "$1") // ***gras italique*** -> texte
      .replace(/\*\*(.*?)\*\*/g, "$1") // **gras** -> texte
      .replace(/\*(.*?)\*/g, "$1") // *italique* -> texte
      .replace(/_(.*?)_/g, "$1") // _souligné_ -> texte
      .replace(/`(.*?)`/g, "$1") // `code` -> texte
      .replace(/#{1,6}\s+/g, "") // # Titre -> Titre
      .replace(/^\s*[-*+]\s+/gm, "• ") // - liste -> • liste
      .replace(/^\s*\d+\.\s+/gm, "") // 1. liste -> liste
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [lien](url) -> lien
      .trim()
  );
};
