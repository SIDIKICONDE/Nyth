import { CardColor, CardStyle, NavigationSection } from "./types";

// Fonctions pour générer les constantes avec traductions
export const getCardColors = (
  t: (key: string, fallback: string) => string
): CardColor[] => [
  {
    id: "blue",
    name: t("planning.tasks.taskModal.customization.colors.blue", "Bleu"),
    color: "#3B82F6",
  },
  {
    id: "green",
    name: t("planning.tasks.taskModal.customization.colors.green", "Vert"),
    color: "#10B981",
  },
  {
    id: "purple",
    name: t("planning.tasks.taskModal.customization.colors.purple", "Violet"),
    color: "#8B5CF6",
  },
  {
    id: "orange",
    name: t("planning.tasks.taskModal.customization.colors.orange", "Orange"),
    color: "#F59E0B",
  },
  {
    id: "red",
    name: t("planning.tasks.taskModal.customization.colors.red", "Rouge"),
    color: "#EF4444",
  },
  {
    id: "pink",
    name: t("planning.tasks.taskModal.customization.colors.pink", "Rose"),
    color: "#EC4899",
  },
  {
    id: "indigo",
    name: t("planning.tasks.taskModal.customization.colors.indigo", "Indigo"),
    color: "#6366F1",
  },
  {
    id: "teal",
    name: t("planning.tasks.taskModal.customization.colors.teal", "Sarcelle"),
    color: "#14B8A6",
  },
  {
    id: "gray",
    name: t("planning.tasks.taskModal.customization.colors.gray", "Gris"),
    color: "#6B7280",
  },
];

// Constantes statiques pour la rétrocompatibilité
export const CARD_COLORS: CardColor[] = [
  { id: "blue", name: "Bleu", color: "#3B82F6" },
  { id: "green", name: "Vert", color: "#10B981" },
  { id: "purple", name: "Violet", color: "#8B5CF6" },
  { id: "orange", name: "Orange", color: "#F59E0B" },
  { id: "red", name: "Rouge", color: "#EF4444" },
  { id: "pink", name: "Rose", color: "#EC4899" },
  { id: "indigo", name: "Indigo", color: "#6366F1" },
  { id: "teal", name: "Sarcelle", color: "#14B8A6" },
  { id: "gray", name: "Gris", color: "#6B7280" },
];

export const CARD_ICONS: string[] = [
  "💼",
  "📋",
  "🎯",
  "⚡",
  "🔥",
  "💡",
  "🚀",
  "⭐",
  "🎨",
  "🔧",
  "📊",
  "💰",
  "🏆",
  "🎪",
  "🌟",
  "🎭",
  "🎸",
  "🎬",
  "📱",
  "💻",
];

export const getCardStyles = (
  t: (key: string, fallback: string) => string
): CardStyle[] => [
  {
    id: "default",
    name: t(
      "planning.tasks.taskModal.customization.styles.default.name",
      "Standard"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.default.description",
      "Style classique avec toutes les informations"
    ),
    preview: "📄",
  },
  {
    id: "minimal",
    name: t(
      "planning.tasks.taskModal.customization.styles.minimal.name",
      "Minimaliste"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.minimal.description",
      "Design épuré avec les infos essentielles"
    ),
    preview: "⚪",
  },
  {
    id: "detailed",
    name: t(
      "planning.tasks.taskModal.customization.styles.detailed.name",
      "Détaillé"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.detailed.description",
      "Maximum d'informations et de fonctionnalités"
    ),
    preview: "📊",
  },
  {
    id: "creative",
    name: t(
      "planning.tasks.taskModal.customization.styles.creative.name",
      "Créatif"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.creative.description",
      "Design artistique avec animations"
    ),
    preview: "🎨",
  },
  {
    id: "compact",
    name: t(
      "planning.tasks.taskModal.customization.styles.compact.name",
      "Compact"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.compact.description",
      "Format condensé pour plus de tâches visibles"
    ),
    preview: "📝",
  },
  {
    id: "modern",
    name: t(
      "planning.tasks.taskModal.customization.styles.modern.name",
      "Moderne"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.modern.description",
      "Design contemporain avec ombres et gradients"
    ),
    preview: "✨",
  },
  {
    id: "kanban",
    name: t(
      "planning.tasks.taskModal.customization.styles.kanban.name",
      "Kanban Pro"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.kanban.description",
      "Optimisé pour les tableaux kanban avancés"
    ),
    preview: "🎯",
  },
  {
    id: "timeline",
    name: t(
      "planning.tasks.taskModal.customization.styles.timeline.name",
      "Timeline"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.timeline.description",
      "Vue chronologique avec dates proéminentes"
    ),
    preview: "📅",
  },
  {
    id: "priority",
    name: t(
      "planning.tasks.taskModal.customization.styles.priority.name",
      "Priorité"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.priority.description",
      "Met l'accent sur l'urgence et l'importance"
    ),
    preview: "🚨",
  },
  {
    id: "progress",
    name: t(
      "planning.tasks.taskModal.customization.styles.progress.name",
      "Progression"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.progress.description",
      "Focus sur l'avancement et les étapes"
    ),
    preview: "📈",
  },
  {
    id: "team",
    name: t(
      "planning.tasks.taskModal.customization.styles.team.name",
      "Équipe"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.team.description",
      "Adapté au travail collaboratif"
    ),
    preview: "👥",
  },
  {
    id: "glass",
    name: t(
      "planning.tasks.taskModal.customization.styles.glass.name",
      "Verre"
    ),
    description: t(
      "planning.tasks.taskModal.customization.styles.glass.description",
      "Effet glassmorphism moderne et élégant"
    ),
    preview: "🔮",
  },
];

export const CARD_STYLES: CardStyle[] = [
  {
    id: "default",
    name: "Standard",
    description: "Style classique avec toutes les informations",
    preview: "📄",
  },
  {
    id: "minimal",
    name: "Minimaliste",
    description: "Design épuré avec les infos essentielles",
    preview: "⚪",
  },
  {
    id: "detailed",
    name: "Détaillé",
    description: "Maximum d'informations et de fonctionnalités",
    preview: "📊",
  },
  {
    id: "creative",
    name: "Créatif",
    description: "Design artistique avec animations",
    preview: "🎨",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Format condensé pour plus de tâches visibles",
    preview: "📝",
  },
  {
    id: "modern",
    name: "Moderne",
    description: "Design contemporain avec ombres et gradients",
    preview: "✨",
  },
  {
    id: "kanban",
    name: "Kanban Pro",
    description: "Optimisé pour les tableaux kanban avancés",
    preview: "🎯",
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "Vue chronologique avec dates proéminentes",
    preview: "📅",
  },
  {
    id: "priority",
    name: "Priorité",
    description: "Met l'accent sur l'urgence et l'importance",
    preview: "🚨",
  },
  {
    id: "progress",
    name: "Progression",
    description: "Focus sur l'avancement et les étapes",
    preview: "📈",
  },
  {
    id: "team",
    name: "Équipe",
    description: "Adapté au travail collaboratif",
    preview: "👥",
  },
  {
    id: "glass",
    name: "Verre",
    description: "Effet glassmorphism moderne et élégant",
    preview: "🔮",
  },
];

export const getNavigationSections = (
  t: (key: string, fallback: string) => string
): NavigationSection[] => [
  {
    id: "preview",
    label: t(
      "planning.tasks.taskModal.customization.sections.preview",
      "Aperçu"
    ),
    icon: "eye-outline",
  },
  {
    id: "colors",
    label: t(
      "planning.tasks.taskModal.customization.sections.colors",
      "Couleurs"
    ),
    icon: "color-palette-outline",
  },
  {
    id: "icons",
    label: t("planning.tasks.taskModal.customization.sections.icons", "Icônes"),
    icon: "happy-outline",
  },
  {
    id: "styles",
    label: t(
      "planning.tasks.taskModal.customization.sections.styles",
      "Styles"
    ),
    icon: "brush-outline",
  },
  {
    id: "features",
    label: t(
      "planning.tasks.taskModal.customization.sections.features",
      "Options"
    ),
    icon: "settings-outline",
  },
];

export const getFeatureDefinitions = (
  t: (key: string, fallback: string) => string
) =>
  [
    {
      key: "showEstimatedTime",
      label: t(
        "planning.tasks.taskModal.customization.features.showEstimatedTime.label",
        "Temps estimé"
      ),
      description: t(
        "planning.tasks.taskModal.customization.features.showEstimatedTime.description",
        "Afficher la durée prévue"
      ),
      icon: "time-outline",
    },
    {
      key: "showProgress",
      label: t(
        "planning.tasks.taskModal.customization.features.showProgress.label",
        "Barre de progression"
      ),
      description: t(
        "planning.tasks.taskModal.customization.features.showProgress.description",
        "Afficher l'avancement"
      ),
      icon: "trending-up-outline",
    },
    {
      key: "showAttachments",
      label: t(
        "planning.tasks.taskModal.customization.features.showAttachments.label",
        "Pièces jointes"
      ),
      description: t(
        "planning.tasks.taskModal.customization.features.showAttachments.description",
        "Afficher les fichiers attachés"
      ),
      icon: "attach-outline",
    },
    {
      key: "showSubtasks",
      label: t(
        "planning.tasks.taskModal.customization.features.showSubtasks.label",
        "Sous-tâches"
      ),
      description: t(
        "planning.tasks.taskModal.customization.features.showSubtasks.description",
        "Afficher les tâches enfants"
      ),
      icon: "list-outline",
    },
  ] as const;

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  { id: "preview", label: "Aperçu", icon: "eye-outline" },
  { id: "colors", label: "Couleurs", icon: "color-palette-outline" },
  { id: "icons", label: "Icônes", icon: "happy-outline" },
  { id: "styles", label: "Styles", icon: "brush-outline" },
  { id: "features", label: "Options", icon: "settings-outline" },
];

export const FEATURE_DEFINITIONS = [
  {
    key: "showEstimatedTime",
    label: "Temps estimé",
    description: "Afficher la durée prévue",
    icon: "time-outline",
  },
  {
    key: "showProgress",
    label: "Barre de progression",
    description: "Afficher l'avancement",
    icon: "trending-up-outline",
  },
  {
    key: "showAttachments",
    label: "Pièces jointes",
    description: "Afficher les fichiers attachés",
    icon: "attach-outline",
  },
  {
    key: "showSubtasks",
    label: "Sous-tâches",
    description: "Afficher les tâches enfants",
    icon: "list-outline",
  },
] as const;

export const DEFAULT_VALUES = {
  CARD_COLOR: "#3B82F6",
  CARD_ICON: "💼",
  CARD_STYLE: "default",
  SHOW_ESTIMATED_TIME: true,
  SHOW_PROGRESS: true,
  SHOW_ATTACHMENTS: false,
  SHOW_SUBTASKS: false,
  ACTIVE_SECTION: "preview",
} as const;
