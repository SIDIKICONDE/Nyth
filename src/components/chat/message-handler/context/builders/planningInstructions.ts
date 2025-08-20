/**
 * Instructions de planification pour l'IA
 */

/**
 * Construit les instructions de planification selon la langue
 */
export const buildPlanningInstructions = (language: string): string => {
  return language === "fr"
    ? `\n\n🎯 CAPACITÉS DE PLANIFICATION:
Tu peux aider l'utilisateur à créer des événements et des objectifs.
Quand l'utilisateur demande de créer quelque chose, utilise les outils appropriés disponibles.

EXEMPLES:
- "Crée un événement demain à 14h" → Utilise l'outil de création d'événement
- "Je veux écrire 5 scripts ce mois" → Utilise l'outil de création d'objectif
- "Planifie une réunion vendredi" → Utilise l'outil de création d'événement

Sois proactif et propose de créer des événements ou objectifs quand c'est pertinent.`
    : `\n\n🎯 PLANNING CAPABILITIES:
You can help the user create events and goals.
When the user asks to create something, use the appropriate available tools.

EXAMPLES:
- "Create event tomorrow at 2pm" → Use the event creation tool
- "I want to write 5 scripts this month" → Use the goal creation tool
- "Schedule a meeting Friday" → Use the event creation tool

Be proactive and suggest creating events or goals when relevant.`;
};
