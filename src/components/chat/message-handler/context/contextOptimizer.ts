/**
 * Analyse et optimise un contexte existant
 */
export const optimizeContext = (
  context: string,
  targetLength?: number
): string => {
  if (!targetLength || context.length <= targetLength) {
    return context;
  }

  // Stratégies d'optimisation
  let optimized = context;

  // 1. Supprimer les espaces multiples
  optimized = optimized.replace(/\n\s*\n\s*\n/g, "\n\n");
  optimized = optimized.replace(/  +/g, " ");

  // 2. Raccourcir les aperçus trop longs
  optimized = optimized.replace(
    /- (Aperçu|Preview): "(.{100,})"/g,
    (match, label, content) => `- ${label}: "${content.substring(0, 80)}..."`
  );

  // 3. Supprimer les métadonnées moins importantes si nécessaire
  if (optimized.length > targetLength) {
    optimized = optimized.replace(/- (Créé|Created): [^\n]+\n/g, "");
    optimized = optimized.replace(/- (Favori|Favorite): [^\n]+\n/g, "");
  }

  return optimized;
};

/**
 * Estime le nombre de tokens approximatif d'un texte
 */
export const estimateTokens = (text: string): number => {
  // Estimation grossière : 1 token ≈ 4 caractères
  return Math.ceil(text.length / 4);
};

/**
 * Vérifie si un contexte dépasse la limite de tokens
 */
export const exceedsTokenLimit = (
  context: string,
  maxTokens: number
): boolean => {
  return estimateTokens(context) > maxTokens;
};

/**
 * Tronque un contexte pour respecter une limite de tokens
 */
export const truncateToTokenLimit = (
  context: string,
  maxTokens: number
): string => {
  if (!exceedsTokenLimit(context, maxTokens)) {
    return context;
  }

  const maxChars = maxTokens * 4;
  const truncated = context.substring(0, maxChars);

  // Essayer de couper à la fin d'une phrase ou d'un paragraphe
  const lastParagraph = truncated.lastIndexOf("\n\n");
  const lastSentence = truncated.lastIndexOf(".");

  if (lastParagraph > maxChars * 0.8) {
    return truncated.substring(0, lastParagraph) + "\n\n[...]";
  } else if (lastSentence > maxChars * 0.8) {
    return truncated.substring(0, lastSentence + 1) + " [...]";
  }

  return truncated + " [...]";
};

/**
 * Optimise un contexte en réduisant progressivement le contenu
 */
export const progressiveOptimization = (
  context: string,
  targetTokens: number
): string => {
  let optimized = context;

  // Niveau 1: Optimisation basique
  optimized = optimizeContext(optimized, targetTokens * 4);

  if (!exceedsTokenLimit(optimized, targetTokens)) {
    return optimized;
  }

  // Niveau 2: Réduction des aperçus
  optimized = optimized.replace(
    /- (Aperçu|Preview): "(.{50,})"/g,
    (match, label, content) => `- ${label}: "${content.substring(0, 30)}..."`
  );

  if (!exceedsTokenLimit(optimized, targetTokens)) {
    return optimized;
  }

  // Niveau 3: Suppression des métadonnées optionnelles
  optimized = optimized.replace(/- (Mots|Words): [^\n]+\n/g, "");
  optimized = optimized.replace(/- (Modifié|Modified): [^\n]+\n/g, "");

  if (!exceedsTokenLimit(optimized, targetTokens)) {
    return optimized;
  }

  // Niveau 4: Troncature finale
  return truncateToTokenLimit(optimized, targetTokens);
};
