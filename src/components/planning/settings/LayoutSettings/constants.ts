import { NavigationSection, PresetData } from "./types";

export const PRESETS: PresetData[] = [
  {
    id: "compact",
    name: "Compact",
    description: "Maximum de cartes visibles, marges réduites",
    icon: "contract-outline",
    color: "#EF4444",
    values: "Marges: 4px • Colonnes: 220px • Espacement: 4px",
  },
  {
    id: "comfortable",
    name: "Confortable",
    description: "Équilibre parfait entre espace et contenu",
    icon: "resize-outline",
    color: "#3B82F6",
    values: "Marges: 16px • Colonnes: 280px • Espacement: 16px",
  },
  {
    id: "spacious",
    name: "Spacieux",
    description: "Plus d'espace pour une lecture facile",
    icon: "expand-outline",
    color: "#10B981",
    values: "Marges: 24px • Colonnes: 320px • Espacement: 24px",
  },
];

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  { id: "presets", label: "Présets", icon: "apps-outline" },
  { id: "margins", label: "Marges", icon: "crop-outline" },
  { id: "columns", label: "Colonnes", icon: "grid-outline" },
  { id: "display", label: "Affichage", icon: "eye-outline" },
];

// Moved to utils.ts to support translations
