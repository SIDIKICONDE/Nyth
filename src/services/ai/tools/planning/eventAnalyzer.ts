/**
 * Détermine le type d'événement basé sur le titre et la description
 */
export function determineEventType(
  title: string,
  description?: string
): string {
  const text = `${title} ${description || ""}`.toLowerCase();

  // Mots-clés pour chaque type d'événement
  const typeKeywords = {
    script_creation: [
      "script",
      "écriture",
      "rédaction",
      "contenu",
      "création",
      "texte",
      "writing",
      "content",
      "creation",
      "draft",
      "brainstorm",
    ],
    recording: [
      "enregistrement",
      "tournage",
      "filmer",
      "vidéo",
      "caméra",
      "micro",
      "recording",
      "filming",
      "video",
      "camera",
      "shoot",
      "capture",
    ],
    editing: [
      "montage",
      "édition",
      "post-production",
      "retouche",
      "finalisation",
      "editing",
      "post-production",
      "finalize",
      "cut",
      "trim",
    ],
    review: [
      "révision",
      "relecture",
      "correction",
      "validation",
      "vérification",
      "review",
      "check",
      "validate",
      "proofread",
      "feedback",
    ],
    deadline: [
      "échéance",
      "deadline",
      "limite",
      "fin",
      "remise",
      "livraison",
      "due",
      "submit",
      "delivery",
      "final",
      "completion",
    ],
    meeting: [
      "réunion",
      "rendez-vous",
      "entretien",
      "appel",
      "conférence",
      "présentation",
      "meeting",
      "appointment",
      "call",
      "conference",
      "presentation",
      "discussion",
    ],
  };

  // Compter les correspondances pour chaque type
  const scores: Record<string, number> = {};

  for (const [eventType, keywords] of Object.entries(typeKeywords)) {
    scores[eventType] = keywords.filter((keyword) =>
      text.includes(keyword)
    ).length;
  }

  // Trouver le type avec le score le plus élevé
  const bestMatch = Object.entries(scores).reduce((best, current) =>
    current[1] > best[1] ? current : best
  );

  // Si aucun mot-clé spécifique n'est trouvé, utiliser "meeting" par défaut
  return bestMatch[1] > 0 ? bestMatch[0] : "meeting";
}

/**
 * Détermine la priorité d'un événement basé sur le titre et la description
 */
export function determineEventPriority(
  title: string,
  description?: string
): string {
  const text = `${title} ${description || ""}`.toLowerCase();

  const priorityKeywords = {
    urgent: [
      "urgent",
      "immédiat",
      "asap",
      "critique",
      "important",
      "prioritaire",
      "emergency",
      "critical",
      "immediate",
      "rush",
      "priority",
    ],
    high: [
      "important",
      "essentiel",
      "crucial",
      "majeur",
      "significatif",
      "major",
      "essential",
      "crucial",
      "significant",
      "key",
    ],
    low: [
      "optionnel",
      "si possible",
      "quand tu peux",
      "pas pressé",
      "plus tard",
      "optional",
      "if possible",
      "when you can",
      "not urgent",
      "later",
    ],
  };

  // Vérifier les mots-clés de priorité
  for (const [priority, keywords] of Object.entries(priorityKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return priority;
    }
  }

  return "medium"; // Priorité par défaut
}

/**
 * Génère des tags automatiquement basés sur le contenu de l'événement
 */
export function generateEventTags(
  title: string,
  eventType: string,
  description?: string
): string[] {
  const text = `${title} ${description || ""}`.toLowerCase();
  const tags: string[] = [];

  // Tags basés sur le type d'événement
  const typeBasedTags: Record<string, string[]> = {
    script_creation: ["créatif", "écriture", "contenu"],
    recording: ["production", "vidéo", "tournage"],
    editing: ["post-production", "montage", "finalisation"],
    review: ["révision", "qualité", "validation"],
    deadline: ["échéance", "livraison", "important"],
    meeting: ["réunion", "collaboration", "discussion"],
  };

  // Ajouter les tags basés sur le type
  if (typeBasedTags[eventType]) {
    tags.push(...typeBasedTags[eventType]);
  }

  // Tags contextuels basés sur le contenu
  const contextualTags = {
    client: ["client", "customer"],
    équipe: ["équipe", "team", "groupe", "group"],
    projet: ["projet", "project"],
    formation: ["formation", "training", "apprentissage", "learning"],
    présentation: ["présentation", "presentation", "demo"],
    brainstorming: ["brainstorm", "idées", "ideas", "créatif", "creative"],
    planification: [
      "planification",
      "planning",
      "organisation",
      "organization",
    ],
    suivi: ["suivi", "follow-up", "status", "point"],
  };

  for (const [tag, keywords] of Object.entries(contextualTags)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.push(tag);
    }
  }

  // Limiter à 5 tags maximum et supprimer les doublons
  return [...new Set(tags)].slice(0, 5);
}
