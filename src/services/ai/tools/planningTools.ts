/**
 * @fileoverview Définit les "outils" (fonctions) que l'IA peut appeler.
 * Ces schémas sont utilisés pour le "Function Calling" des modèles d'IA.
 */

// Outil pour la création d'événements
export const createEventTool = {
  type: "function" as const,
  function: {
    name: "createEvent",
    description:
      "Crée un nouvel événement dans le calendrier de l'utilisateur. Analyse la demande pour déterminer le type d'événement approprié (script_creation, recording, editing, review, meeting, deadline), la priorité (low, medium, high, urgent) et les tags pertinents. Convertit les dates relatives (comme 'demain') en dates complètes.",
    parameters: {
      type: "object" as const,
      properties: {
        title: {
          type: "string" as const,
          description:
            "Le titre ou le nom de l'événement. Par exemple: 'Réunion avec l'équipe marketing'.",
        },
        startDate: {
          type: "string" as const,
          description:
            "La date et l'heure de début de l'événement au format ISO 8601. Par exemple: '2024-07-01T14:00:00Z'.",
        },
        endDate: {
          type: "string" as const,
          description:
            "La date et l'heure de fin de l'événement au format ISO 8601. Doit être après la date de début.",
        },
        location: {
          type: "string" as const,
          description:
            "Optionnel. Le lieu de l'événement. Par exemple: 'Bureau 301' ou 'En ligne'.",
        },
        description: {
          type: "string" as const,
          description:
            "Optionnel. Une description plus détaillée ou le sujet de l'événement.",
        },
        type: {
          type: "string" as const,
          description:
            "Optionnel. Le type d'événement basé sur la demande de l'utilisateur.",
          enum: [
            "script_creation",
            "recording",
            "editing",
            "review",
            "meeting",
            "deadline",
          ],
        },
        priority: {
          type: "string" as const,
          description:
            "Optionnel. La priorité de l'événement basée sur l'urgence exprimée par l'utilisateur.",
          enum: ["low", "medium", "high", "urgent"],
        },
        tags: {
          type: "array" as const,
          description:
            "Optionnel. Liste de mots-clés ou tags pour catégoriser l'événement.",
          items: {
            type: "string" as const,
          },
        },
      },
      required: ["title", "startDate", "endDate"],
    },
  },
};

// Outil pour la modification d'événements
export const updateEventTool = {
  type: "function" as const,
  function: {
    name: "updateEvent",
    description:
      "Modifie un événement existant dans le calendrier de l'utilisateur. Recherche l'événement par titre, date ou description mentionnés dans la conversation.",
    parameters: {
      type: "object" as const,
      properties: {
        searchCriteria: {
          type: "string" as const,
          description:
            "Critères de recherche pour identifier l'événement à modifier. Par exemple: 'réunion marketing demain' ou 'événement à 14h'.",
        },
        updates: {
          type: "object" as const,
          description: "Les modifications à apporter à l'événement.",
          properties: {
            title: {
              type: "string" as const,
              description: "Nouveau titre de l'événement.",
            },
            startDate: {
              type: "string" as const,
              description:
                "Nouvelle date et heure de début au format ISO 8601.",
            },
            endDate: {
              type: "string" as const,
              description: "Nouvelle date et heure de fin au format ISO 8601.",
            },
            location: {
              type: "string" as const,
              description: "Nouveau lieu de l'événement.",
            },
            description: {
              type: "string" as const,
              description: "Nouvelle description de l'événement.",
            },
          },
        },
      },
      required: ["searchCriteria", "updates"],
    },
  },
};

// Outil pour la suppression d'événements
export const deleteEventTool = {
  type: "function" as const,
  function: {
    name: "deleteEvent",
    description:
      "Supprime un événement du calendrier de l'utilisateur. Recherche l'événement par titre, date ou description mentionnés dans la conversation.",
    parameters: {
      type: "object" as const,
      properties: {
        searchCriteria: {
          type: "string" as const,
          description:
            "Critères de recherche pour identifier l'événement à supprimer. Par exemple: 'réunion marketing demain' ou 'événement à 14h'.",
        },
      },
      required: ["searchCriteria"],
    },
  },
};

// Outil pour la création d'objectifs
export const createGoalTool = {
  type: "function" as const,
  function: {
    name: "createGoal",
    description:
      "Crée un nouvel objectif pour l'utilisateur. Les objectifs sont utilisés pour suivre des progrès sur une période donnée.",
    parameters: {
      type: "object" as const,
      properties: {
        title: {
          type: "string" as const,
          description:
            "Le titre de l'objectif. Par exemple: 'Écrire 3 nouveaux scripts cette semaine'.",
        },
        target: {
          type: "number" as const,
          description: "La valeur cible à atteindre. Par exemple: 3.",
        },
        unit: {
          type: "string" as const,
          description:
            "L'unité de la cible. Par exemple: 'scripts', 'mots', 'heures'.",
        },
        endDate: {
          type: "string" as const,
          description:
            "Optionnel. La date limite pour atteindre l'objectif au format ISO 8601.",
        },
      },
      required: ["title", "target", "unit"],
    },
  },
};

// Exporter une liste de tous les outils disponibles
export const planningTools = [
  createEventTool,
  updateEventTool,
  deleteEventTool,
  createGoalTool,
];
