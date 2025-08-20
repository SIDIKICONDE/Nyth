import { AIMemoryEntry } from "./types";

export interface MemoryPattern {
  pattern: RegExp;
  type: AIMemoryEntry["type"];
  importance: AIMemoryEntry["importance"];
  name?: string;
  description?: string;
  examples?: string[];
}

/**
 * Patterns pour détecter les informations importantes à mémoriser
 */
export const getMemoryPatterns = (): MemoryPattern[] => [
  // ===== PRÉFÉRENCES =====
  {
    pattern:
      /je préfère|j'aime|je n'aime pas|ma préférence|j'adore|je déteste/i,
    type: "preference",
    importance: "medium",
  },
  {
    pattern:
      /i prefer|i like|i don't like|my preference|i love|i hate|i enjoy/i,
    type: "preference",
    importance: "medium",
  },

  // ===== INSTRUCTIONS EXPLICITES =====
  {
    pattern: /souviens-toi|rappelle-toi|n'oublie pas|retiens|mémorise/i,
    type: "instruction",
    importance: "high",
  },
  {
    pattern:
      /remember|don't forget|keep in mind|note that|memorize|bear in mind/i,
    type: "instruction",
    importance: "high",
  },

  // ===== INSTRUCTIONS NÉGATIVES =====
  {
    pattern:
      /ne plus|n'évoque plus|arrête de|stop|plus jamais|évite de|ne mentionne plus/i,
    type: "instruction",
    importance: "high",
  },
  {
    pattern:
      /don't mention|stop mentioning|no more|avoid mentioning|don't bring up/i,
    type: "instruction",
    importance: "high",
  },

  // ===== AMBIGUÏTÉS FRANÇAISES (contexte négatif) =====
  {
    pattern:
      /je veux plus que tu.*(?:mentionne|parle|évoque|cite).*(?:script|projet|travail)/i,
    type: "instruction",
    importance: "high",
  },
  {
    pattern: /je ne veux plus|j'en ai assez|ça suffit|arrête/i,
    type: "instruction",
    importance: "high",
  },

  // ===== INFORMATIONS PERSONNELLES =====
  {
    pattern:
      /je suis|je travaille|mon métier|ma profession|mon nom est|j'habite|je vis/i,
    type: "fact",
    importance: "medium",
  },
  {
    pattern: /i am|i work|my job|my profession|my name is|i live|i'm from/i,
    type: "fact",
    importance: "medium",
  },

  // ===== HABITUDES ET ROUTINES =====
  {
    pattern:
      /d'habitude|généralement|habituellement|toujours|jamais|souvent|rarement/i,
    type: "habit",
    importance: "low",
  },
  {
    pattern: /usually|generally|always|never|often|rarely|typically|normally/i,
    type: "habit",
    importance: "low",
  },

  // ===== OBJECTIFS ET PROJETS =====
  {
    pattern:
      /mon objectif|mon projet|je veux|je souhaite|mon but|je compte|j'ai l'intention/i,
    type: "goal",
    importance: "medium",
  },
  {
    pattern: /my goal|my project|i want|i wish|my aim|i plan|i intend/i,
    type: "goal",
    importance: "medium",
  },

  // ===== COMPÉTENCES ET EXPÉRIENCE =====
  {
    pattern:
      /je sais|je connais|j'ai de l'expérience|je maîtrise|je ne sais pas|je ne connais pas/i,
    type: "skill",
    importance: "medium",
  },
  {
    pattern: /i know|i can|i have experience|i master|i don't know|i can't/i,
    type: "skill",
    importance: "medium",
  },

  // ===== CONTEXTE TEMPOREL =====
  {
    pattern: /cette semaine|ce mois|cette année|bientôt|récemment|hier|demain/i,
    type: "context",
    importance: "low",
  },
  {
    pattern: /this week|this month|this year|soon|recently|yesterday|tomorrow/i,
    type: "context",
    importance: "low",
  },

  // ===== PROBLÈMES ET DÉFIS =====
  {
    pattern:
      /mon problème|ma difficulté|je galère|j'ai du mal|ça ne marche pas/i,
    type: "problem",
    importance: "medium",
  },
  {
    pattern: /my problem|my issue|i struggle|i have trouble|it doesn't work/i,
    type: "problem",
    importance: "medium",
  },

  // ===== LANGUES MULTILINGUES =====
  // Espagnol
  {
    pattern:
      /prefiero|me gusta|no me gusta|mi preferencia|recuerda|no olvides/i,
    type: "preference",
    importance: "medium",
  },
  // Allemand
  {
    pattern: /ich bevorzuge|ich mag|ich mag nicht|vergiss nicht|erinnere dich/i,
    type: "preference",
    importance: "medium",
  },
  // Italien
  {
    pattern: /preferisco|mi piace|non mi piace|ricorda|non dimenticare/i,
    type: "preference",
    importance: "medium",
  },
  // Chinois (patterns basiques)
  {
    pattern: /我喜欢|我不喜欢|我更喜欢|记住|不要忘记/i,
    type: "preference",
    importance: "medium",
  },
  // Japonais (patterns basiques)
  {
    pattern: /好きです|嫌いです|覚えて|忘れないで/i,
    type: "preference",
    importance: "medium",
  },
];

/**
 * Patterns spécialisés pour les instructions négatives
 */
export const getNegativeInstructionPatterns = (): MemoryPattern[] => [
  {
    pattern: /ne plus.*(?:mentionne|parle|évoque|cite)/i,
    type: "instruction",
    importance: "high",
  },
  {
    pattern: /arrête.*(?:de parler|de mentionner|d'évoquer)/i,
    type: "instruction",
    importance: "high",
  },
  {
    pattern: /stop.*(?:mentioning|talking about|bringing up)/i,
    type: "instruction",
    importance: "high",
  },
];

/**
 * Patterns pour détecter les préférences de style de communication
 */
export const getCommunicationPatterns = (): MemoryPattern[] => [
  {
    pattern: /réponds.*(?:court|bref|simple|direct)/i,
    type: "preference",
    importance: "medium",
  },
  {
    pattern: /respond.*(?:short|brief|simple|direct)/i,
    type: "preference",
    importance: "medium",
  },
  {
    pattern: /explique.*(?:détail|complet|approfondi)/i,
    type: "preference",
    importance: "medium",
  },
  {
    pattern: /explain.*(?:detail|complete|thorough)/i,
    type: "preference",
    importance: "medium",
  },
];

/**
 * Teste un message contre tous les patterns
 */
export const testAllPatterns = (message: string): MemoryPattern[] => {
  const allPatterns = [
    ...getMemoryPatterns(),
    ...getNegativeInstructionPatterns(),
    ...getCommunicationPatterns(),
  ];

  return allPatterns.filter((pattern) => pattern.pattern.test(message));
};

/**
 * Détecte si un message contient des mots-clés de négation
 */
export const hasNegationKeywords = (message: string): boolean => {
  const negationPatterns =
    /ne plus|n'évoque plus|arrête de|stop|plus jamais|évite de|ne mentionne plus|don't|stop|never|avoid/i;
  return negationPatterns.test(message);
};

/**
 * Export des patterns comme constante
 */
export const patterns = getMemoryPatterns();
