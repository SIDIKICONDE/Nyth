/**
 * Utilitaires de nettoyage de texte
 */

/**
 * Nettoie le texte des caractères markdown pour l'affichage en texte simple
 */
export const cleanMarkdownText = (text: string): string => {
  if (!text) return text;

  return (text
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
    .replace(/\n\s*\n/g, "\n\n") // Normaliser les lignes vides
    .trim());
};
