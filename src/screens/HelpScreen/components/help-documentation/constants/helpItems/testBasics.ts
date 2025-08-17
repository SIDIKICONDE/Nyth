import { HelpItem } from "../../types";

export const testBasicsItems: HelpItem[] = [
  {
    id: "test-first-steps",
    title: "Test - Premiers pas",
    description: "Test du guide pour débuter",
    icon: "play-circle",
    color: "#3B82F6",
    category: "basics",
    content: [
      {
        type: "text",
        content: "Ceci est un test du composant refactorisé.",
      },
      {
        type: "list",
        title: "Points de test :",
        content: [
          "Import des types fonctionne",
          "Structure des données correcte",
          "Rendu sans erreur",
        ],
      },
    ],
  },
];
