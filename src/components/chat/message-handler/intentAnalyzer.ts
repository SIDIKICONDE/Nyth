/**
 * @fileoverview Analyseur d'intentions pour les messages
 * Détermine si un message nécessite l'utilisation du Function Calling
 */

import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("IntentAnalyzer");

/**
 * Mots-clés pour différents types d'actions
 */
export const INTENT_KEYWORDS = {
  create: [
    "crée",
    "créer",
    "crée-moi",
    "créez",
    "créez-moi",
    "ajoute",
    "ajouter",
    "ajoute-moi",
    "ajoutez",
    "ajoutez-moi",
    "planifie",
    "planifier",
    "planifie-moi",
    "planifiez",
    "planifiez-moi",
    "programme",
    "programmer",
    "programme-moi",
    "programmez",
    "programmez-moi",
    "rendez-vous",
    "meeting",
    "réunion",
    "événement",
    "event",
    "objectif",
    "goal",
    "but",
  ],

  update: [
    "modifie",
    "modifier",
    "change",
    "changer",
    "décale",
    "décaler",
    "reporte",
    "reporter",
    "met à jour",
    "mettre à jour",
    "edit",
  ],

  delete: [
    "supprime",
    "supprimer",
    "annule",
    "annuler",
    "efface",
    "effacer",
    "delete",
    "remove",
    "cancel",
  ],
} as const;

// Déclencheurs stricts pour thèmes (action + objet)
const THEME_ACTION_KEYWORDS: string[] = [
  "crée",
  "créer",
  "génère",
  "générer",
  "ajoute",
  "ajouter",
  "je veux",
  "je voudrais",
  "je voulais",
];

const THEME_OBJECT_KEYWORDS: string[] = [
  "thème",
  "theme",
  "palette",
  "couleur",
  "couleurs",
  "style",
  "apparence",
  "mode sombre",
  "mode clair",
];

export function hasThemeIntent(message: string): boolean {
  const m = (message || "").toLowerCase();
  const hasAction = THEME_ACTION_KEYWORDS.some((k) => m.includes(k));
  const hasObject = THEME_OBJECT_KEYWORDS.some((k) => m.includes(k));
  return hasAction && hasObject;
}

/**
 * Détermine si le message nécessite l'utilisation du Function Calling
 * Analyse les mots-clés pour détecter les intentions de planification
 */
export function needsFunctionCalling(message: string): boolean {
  const messageLower = message.toLowerCase();
  logger.debug("Analyse du message:", { message: messageLower });

  // Règle stricte thèmes: verbe d'action + mot-clé objet
  const hasThemeAction = THEME_ACTION_KEYWORDS.some((k) =>
    messageLower.includes(k)
  );
  const hasThemeObject = THEME_OBJECT_KEYWORDS.some((k) =>
    messageLower.includes(k)
  );
  if (hasThemeAction && hasThemeObject) {
    logger.debug("Intention thème détectée (strict)");
    return true;
  }

  const allKeywords = [
    ...INTENT_KEYWORDS.create,
    ...INTENT_KEYWORDS.update,
    ...INTENT_KEYWORDS.delete,
  ];

  const foundKeywords = allKeywords.filter((keyword) =>
    messageLower.includes(keyword)
  );

  const needsFC = foundKeywords.length > 0;

  logger.debug("Mots-clés trouvés:", { foundKeywords, needsFC });

  return needsFC;
}

/**
 * Analyse le type d'intention dans un message
 */
export function analyzeIntent(message: string): {
  type: "create" | "update" | "delete" | "chat";
  keywords: string[];
  confidence: number;
} {
  const messageLower = message.toLowerCase();

  const results = {
    create: INTENT_KEYWORDS.create.filter((k) => messageLower.includes(k)),
    update: INTENT_KEYWORDS.update.filter((k) => messageLower.includes(k)),
    delete: INTENT_KEYWORDS.delete.filter((k) => messageLower.includes(k)),
  };

  // Déterminer le type dominant
  const maxCount = Math.max(
    results.create.length,
    results.update.length,
    results.delete.length
  );

  if (maxCount === 0) {
    return { type: "chat", keywords: [], confidence: 0 };
  }

  let type: "create" | "update" | "delete";
  let keywords: string[];

  if (results.create.length === maxCount) {
    type = "create";
    keywords = results.create;
  } else if (results.update.length === maxCount) {
    type = "update";
    keywords = results.update;
  } else {
    type = "delete";
    keywords = results.delete;
  }

  // Calculer la confiance (nombre de mots-clés trouvés / total possible pour ce type)
  const totalKeywordsForType = INTENT_KEYWORDS[type].length;
  const confidence = keywords.length / totalKeywordsForType;

  return { type, keywords, confidence };
}
