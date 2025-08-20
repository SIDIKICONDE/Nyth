import { NavigationSection, PresetData } from "./types";

export const getNavigationSections = (
  t: (key: string, fallback: string) => string
): NavigationSection[] => [
  {
    id: "presets",
    label: t("planning.settings.layout.sections.presets", "Présets"),
    icon: "apps-outline",
  },
  {
    id: "margins",
    label: t("planning.settings.layout.sections.margins", "Marges"),
    icon: "crop-outline",
  },
  {
    id: "columns",
    label: t("planning.settings.layout.navigation.columns", "Colonnes"),
    icon: "grid-outline",
  },
  {
    id: "display",
    label: t("planning.settings.layout.sections.display", "Affichage"),
    icon: "eye-outline",
  },
];

export const getPresets = (
  t: (key: string, fallback: string) => string
): PresetData[] => [
  {
    id: "compact",
    name: t("planning.settings.layout.presets.compact.name", "Compact"),
    description: t(
      "planning.settings.layout.presets.compact.description",
      "Maximum de cartes visibles, marges réduites"
    ),
    icon: "contract-outline",
    color: "#EF4444",
    values: t(
      "planning.settings.layout.presets.compact.values",
      "Marges: 4px • Colonnes: 220px • Espacement: 4px"
    ),
  },
  {
    id: "comfortable",
    name: t("planning.settings.layout.presets.comfortable.name", "Confortable"),
    description: t(
      "planning.settings.layout.presets.comfortable.description",
      "Équilibre parfait entre espace et contenu"
    ),
    icon: "resize-outline",
    color: "#3B82F6",
    values: t(
      "planning.settings.layout.presets.comfortable.values",
      "Marges: 16px • Colonnes: 280px • Espacement: 16px"
    ),
  },
  {
    id: "spacious",
    name: t("planning.settings.layout.presets.spacious.name", "Spacieux"),
    description: t(
      "planning.settings.layout.presets.spacious.description",
      "Plus d'espace pour une lecture facile"
    ),
    icon: "expand-outline",
    color: "#10B981",
    values: t(
      "planning.settings.layout.presets.spacious.values",
      "Marges: 24px • Colonnes: 320px • Espacement: 24px"
    ),
  },
];

export const MARGIN_VALUES = {
  horizontal: [8, 12, 16, 20, 24, 32],
  vertical: [8, 10, 12, 16, 20, 24],
  between: [4, 6, 8, 10, 12, 16],
};

export const COLUMN_VALUES = {
  width: [240, 260, 280, 300, 320, 360],
  spacing: [8, 12, 16, 20, 24, 32],
  padding: [8, 12, 16, 20, 24, 32],
  borderRadius: [4, 8, 12, 16, 20],
};
