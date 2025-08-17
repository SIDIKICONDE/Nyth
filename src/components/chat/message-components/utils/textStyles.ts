import { ChatStyleId } from "@/contexts/ChatStyleContext";
import { getTextColorForUserMessage } from "./textColors";

export interface TextStyleParams {
  isUser: boolean;
  selectedStyle: ChatStyleId;
  currentTheme: any;
  getFontFamily: () => any;
}

/**
 * Génère les styles de texte pour les messages
 * Utilise le système centralisé de polices avec des tailles appropriées
 */
export const getTextStyle = ({
  isUser,
  selectedStyle,
  currentTheme,
  getFontFamily,
}: TextStyleParams) => {
  return {
    color: isUser
      ? getTextColorForUserMessage(selectedStyle, currentTheme)
      : currentTheme.colors.text,
    // Tailles équivalentes du système centralisé : sm (14px) pour utilisateur, base (16px) pour IA
    fontSize: isUser ? 14 : 16,
    lineHeight: isUser ? 20 : 23, // Meilleur espacement des lignes pour l'IA
    letterSpacing: 0.1,
    ...getFontFamily(),
  };
};

/**
 * Génère les styles pour les timestamps
 * Utilise le système centralisé avec la taille xs (12px) mais ajustée à 10px pour les timestamps
 */
export const getTimeStyle = ({
  isUser,
  selectedStyle,
  currentTheme,
  getFontFamily,
}: TextStyleParams) => {
  return {
    color: isUser
      ? getTextColorForUserMessage(selectedStyle, currentTheme, true)
      : currentTheme.colors.textSecondary,
    fontSize: 10, // Taille spéciale pour les timestamps, plus petite que xs (12px)
    marginTop: 4,
    letterSpacing: 0.2,
    ...getFontFamily(),
  };
};
