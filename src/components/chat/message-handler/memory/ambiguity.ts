export interface AmbiguityResult {
  hasAmbiguity: boolean;
  ambiguityType: "preference" | "instruction" | "context" | "none";
  confidence: number;
  suggestions: string[];
  reason: string;
}

/**
 * Détecte l'ambiguïté dans un message
 */
export const detectAmbiguity = (message: string): AmbiguityResult => {
  // Patterns d'ambiguïté
  const ambiguityPatterns = [
    {
      pattern: /peut-être|probablement|je pense|il me semble/i,
      type: "preference" as const,
      reason: "Expression d'incertitude détectée",
    },
    {
      pattern: /parfois|des fois|de temps en temps/i,
      type: "context" as const,
      reason: "Fréquence variable détectée",
    },
    {
      pattern: /ça dépend|selon|en fonction de/i,
      type: "context" as const,
      reason: "Condition contextuelle détectée",
    },
  ];

  for (const { pattern, type, reason } of ambiguityPatterns) {
    if (pattern.test(message)) {
      return {
        hasAmbiguity: true,
        ambiguityType: type,
        confidence: 0.7,
        suggestions: [
          "Pouvez-vous préciser dans quelles circonstances exactement ?",
          "Est-ce une préférence constante ou situationnelle ?",
        ],
        reason,
      };
    }
  }

  return {
    hasAmbiguity: false,
    ambiguityType: "none",
    confidence: 0.9,
    suggestions: [],
    reason: "Aucune ambiguïté détectée",
  };
};

/**
 * Résout l'ambiguïté en proposant des clarifications
 */
export const resolveAmbiguity = async (
  message: string,
  context: string[]
): Promise<string> => {
  const ambiguity = detectAmbiguity(message);

  if (!ambiguity.hasAmbiguity) {
    return message;
  }

  // Retourner une version clarifiée du message
  return `${message} (Clarification suggérée: ${ambiguity.suggestions[0]})`;
};

/**
 * Détecte les ambiguïtés françaises courantes
 */
const detectFrenchAmbiguities = (message: string): boolean => {
  const ambiguousPatterns = [
    /je veux plus(?!\s+de)/i, // "je veux plus" sans "de"
    /j'en veux plus(?!\s+de)/i, // "j'en veux plus"
    /plus de.*(?:ça|cela|ce)/i, // "plus de ça" peut être ambigu
  ];

  return ambiguousPatterns.some((pattern) => pattern.test(message));
};

/**
 * Génère des suggestions pour clarifier l'ambiguïté
 */
const getSuggestionsForFrenchAmbiguity = (message: string): string[] => {
  if (/je veux plus/.test(message)) {
    return [
      "Je ne veux plus (arrêter)",
      "Je veux davantage (plus de quantité)",
    ];
  }

  if (/plus de/.test(message)) {
    return ["Plus de (davantage)", "Ne plus de (arrêter)"];
  }

  return [];
};

/**
 * Détermine le sens probable basé sur le contexte
 */
const determineLikelyMeaning = (
  message: string
): "positive" | "negative" | "unclear" => {
  // Indicateurs de contexte négatif
  const negativeIndicators = [
    /(?:mentionne|parle|évoque|cite).*(?:script|projet|travail)/i,
    /(?:script|projet|travail).*(?:mentionne|parle|évoque|cite)/i,
    /arrête|stop|assez|suffit/i,
  ];

  // Indicateurs de contexte positif
  const positiveIndicators = [
    /davantage|encore|beaucoup|souvent/i,
    /aime|adore|préfère/i,
  ];

  if (negativeIndicators.some((pattern) => pattern.test(message))) {
    return "negative";
  }

  if (positiveIndicators.some((pattern) => pattern.test(message))) {
    return "positive";
  }

  return "unclear";
};

/**
 * Vérifie si un message contient des mots-clés de négation
 */
export const hasNegationKeywords = (message: string): boolean => {
  const negationPatterns = [
    /ne.*pas/i,
    /ne.*plus/i,
    /ne.*jamais/i,
    /aucun/i,
    /arrête/i,
    /stop/i,
    /assez/i,
    /suffit/i,
  ];

  return negationPatterns.some((pattern) => pattern.test(message));
};

/**
 * Analyse la polarité émotionnelle d'un message
 */
export const analyzeEmotionalPolarity = (
  message: string
): "positive" | "negative" | "neutral" => {
  const positiveWords =
    /aime|adore|préfère|bien|super|génial|parfait|excellent/i;
  const negativeWords =
    /déteste|hais|horrible|nul|mauvais|problème|difficulté|galère/i;

  if (positiveWords.test(message)) return "positive";
  if (negativeWords.test(message)) return "negative";
  return "neutral";
};
