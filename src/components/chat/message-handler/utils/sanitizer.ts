/**
 * Utilitaires pour nettoyer et sanitiser les contenus de messages
 */

/**
 * Nettoie les directives système (par ex. "SYSTEM LANGUAGE: fr")
 * afin qu'elles ne soient ni envoyées à l'IA, ni affichées à l'utilisateur.
 */
export const sanitizeContent = (text: string): string => {
  if (!text) return text;

  // Supprimer toute ligne qui commence par "SYSTEM LANGUAGE:" (insensible à la casse)
  const cleaned = text
    .split(/\r?\n/)
    .filter((line) => !/^\s*SYSTEM LANGUAGE:/i.test(line))
    .join("\n")
    .trim();

  return cleaned;
};
