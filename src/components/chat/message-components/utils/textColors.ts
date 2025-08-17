import { ChatStyleId } from "@/contexts/ChatStyleContext";

/**
 * Obtient la couleur du texte selon le style de bulle sélectionné
 */
export const getTextColorForUserMessage = (
  selectedStyle: ChatStyleId,
  currentTheme: any,
  isTimestamp = false
): string => {
  switch (selectedStyle) {
    case "minimal":
      // Style minimal avec fond transparent - utiliser la couleur du thème
      return isTimestamp
        ? currentTheme.colors.textSecondary
        : currentTheme.colors.text;
    case "neon":
      // Style néon avec fond coloré - utiliser blanc
      return isTimestamp ? "rgba(255, 255, 255, 0.7)" : "#FFFFFF";
    case "modern":
      // Style moderne avec fond coloré - utiliser blanc
      return isTimestamp ? "rgba(255, 255, 255, 0.7)" : "#FFFFFF";
    case "elegant":
      // Style élégant avec fond coloré - utiliser blanc
      return isTimestamp ? "rgba(255, 255, 255, 0.7)" : "#FFFFFF";
    case "retro":
      // Style rétro avec fond coloré - utiliser blanc
      return isTimestamp ? "rgba(255, 255, 255, 0.7)" : "#FFFFFF";
    case "glass":
      // Style verre avec fond semi-transparent - utiliser couleur du thème
      return isTimestamp
        ? currentTheme.colors.textSecondary
        : currentTheme.colors.text;
    case "ios":
      // Style iOS avec fond sombre - utiliser blanc/gris clair
      return isTimestamp ? "rgba(255, 255, 255, 0.6)" : "#FFFFFF";
    case "gradient":
      // Style dégradé avec fond coloré - utiliser blanc
      return isTimestamp ? "rgba(255, 255, 255, 0.7)" : "#FFFFFF";
    case "terminal":
      // Style terminal avec fond coloré - utiliser blanc
      return isTimestamp ? "rgba(255, 255, 255, 0.7)" : "#FFFFFF";
    case "chatgpt":
      // Style ChatGPT - utiliser les couleurs du thème comme ChatGPT
      return isTimestamp
        ? currentTheme.colors.textSecondary
        : currentTheme.colors.text;
    default:
      // Style classic sans fond - utiliser la couleur du texte normale
      return isTimestamp
        ? currentTheme.colors.textSecondary
        : currentTheme.colors.text;
  }
};
