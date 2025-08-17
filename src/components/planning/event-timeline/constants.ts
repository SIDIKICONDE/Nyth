import { PlanningEvent } from "../../../types/planning";

// Couleurs de statut avec un design moderne
export const STATUS_COLORS = {
  planned: {
    background: "#3B82F6",
    backgroundLight: "#DBEAFE",
    text: "#1E40AF",
    border: "#93C5FD",
  },
  in_progress: {
    background: "#F59E0B",
    backgroundLight: "#FEF3C7",
    text: "#D97706",
    border: "#FCD34D",
  },
  completed: {
    background: "#10B981",
    backgroundLight: "#D1FAE5",
    text: "#047857",
    border: "#6EE7B7",
  },
  cancelled: {
    background: "#EF4444",
    backgroundLight: "#FEE2E2",
    text: "#DC2626",
    border: "#FCA5A5",
  },
  postponed: {
    background: "#8B5CF6",
    backgroundLight: "#EDE9FE",
    text: "#7C3AED",
    border: "#C4B5FD",
  },
} as const;

// Couleurs de priorité avec gradients modernes
export const PRIORITY_COLORS = {
  low: {
    background: "#10B981",
    backgroundLight: "#D1FAE5",
    text: "#047857",
    gradient: ["#10B981", "#34D399"],
  },
  medium: {
    background: "#F59E0B",
    backgroundLight: "#FEF3C7",
    text: "#D97706",
    gradient: ["#F59E0B", "#FBBF24"],
  },
  high: {
    background: "#EF4444",
    backgroundLight: "#FEE2E2",
    text: "#DC2626",
    gradient: ["#EF4444", "#F87171"],
  },
  urgent: {
    background: "#DC2626",
    backgroundLight: "#FEE2E2",
    text: "#991B1B",
    gradient: ["#DC2626", "#EF4444"],
  },
} as const;

// Icônes de type d'événement avec style moderne
export const EVENT_TYPE_ICONS = {
  script_creation: {
    icon: "document-text-outline",
    solidIcon: "document-text",
    color: "#3B82F6",
    background: "#DBEAFE",
  },
  recording: {
    icon: "videocam-outline",
    solidIcon: "videocam",
    color: "#EF4444",
    background: "#FEE2E2",
  },
  editing: {
    icon: "cut-outline",
    solidIcon: "cut",
    color: "#8B5CF6",
    background: "#EDE9FE",
  },
  review: {
    icon: "eye-outline",
    solidIcon: "eye",
    color: "#10B981",
    background: "#D1FAE5",
  },
  meeting: {
    icon: "people-outline",
    solidIcon: "people",
    color: "#F59E0B",
    background: "#FEF3C7",
  },
  deadline: {
    icon: "alarm-outline",
    solidIcon: "alarm",
    color: "#DC2626",
    background: "#FEE2E2",
  },
} as const;

// Labels traduits pour les statuts
export const STATUS_LABELS: Record<PlanningEvent["status"], string> = {
  planned: "Planifié",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  postponed: "Reporté",
};

// Labels traduits pour les priorités
export const PRIORITY_LABELS: Record<PlanningEvent["priority"], string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  urgent: "Urgente",
};

// Labels traduits pour les types
export const EVENT_TYPE_LABELS: Record<PlanningEvent["type"], string> = {
  script_creation: "Création de script",
  recording: "Enregistrement",
  editing: "Montage",
  review: "Révision",
  meeting: "Réunion",
  deadline: "Échéance",
};

// Options de groupement
export const GROUP_BY_OPTIONS = [
  { value: "date", label: "By Date" },
  { value: "status", label: "By Status" },
  { value: "type", label: "By Type" },
  { value: "priority", label: "By Priority" },
] as const;

// Options de tri
export const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

// Animations et transitions
export const ANIMATION_CONFIG = {
  duration: 300,
  easing: "ease-in-out",
  stagger: 50,
} as const;

// Tailles des composants
export const COMPONENT_SIZES = {
  timelineItemHeight: 120,
  timelineLineWidth: 2,
  timelineDotSize: 16,
  timelineMargin: 24,
  cardBorderRadius: 12,
  badgeBorderRadius: 8,
} as const;
