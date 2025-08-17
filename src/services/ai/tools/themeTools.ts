/**
 * Outils de création de thèmes pour le Function Calling
 */

export const createThemeTool = {
  type: "function" as const,
  function: {
    name: "createTheme",
    description:
      "Crée et applique un thème personnalisé pour l'utilisateur à partir d'une description en langage naturel (ex: 'néon sombre violet/bleu').",
    parameters: {
      type: "object" as const,
      properties: {
        description: {
          type: "string" as const,
          description:
            "Description du style visuel souhaité (ex: 'pastel doux clair', 'sombre futuriste néon').",
        },
        preferDark: {
          type: "boolean" as const,
          description:
            "Préférence de mode sombre (true) ou clair (false). Optionnel.",
        },
        name: {
          type: "string" as const,
          description: "Nom facultatif à donner au thème.",
        },
      },
      required: ["description"],
    },
  },
};

export const themeTools = [createThemeTool];
