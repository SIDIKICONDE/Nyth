import { Tab } from "./task-modal-types";

export const UI_CONFIG = {
  TAB_ICON_SIZE: 16,
  HEADER_BUTTON_MIN_WIDTH: 60,
  HEADER_SAVE_PADDING: 12,
  SPACER_HEIGHT: 40,
} as const;

export const SPACING = {
  HEADER_HORIZONTAL: 16,
  HEADER_VERTICAL: 12,
  HEADER_BUTTON_HORIZONTAL: 8,
  HEADER_BUTTON_VERTICAL: 6,
  TAB_NAVIGATION_HORIZONTAL: 16,
  TAB_NAVIGATION_VERTICAL: 8,
  TAB_GAP: 8,
  TAB_PADDING_VERTICAL: 10,
  TAB_PADDING_HORIZONTAL: 12,
  TAB_ICON_GAP: 6,
  CONTENT_PADDING: 16,
  BORDER_RADIUS_HEADER_BUTTON: 6,
  BORDER_RADIUS_TAB: 8,
} as const;

export const LABELS = {
  CREATE_TASK: "Nouvelle tâche",
  EDIT_TASK: "Modifier la tâche",
  CANCEL: "Annuler",
  SAVE: "Sauver",
  SAVING: "...",
  DETAILS_TAB: "Détails",
  CUSTOMIZATION_TAB: "Personnalisation",
} as const;

export const TABS: readonly Tab[] = [
  {
    id: "details",
    label: LABELS.DETAILS_TAB,
    icon: "document-text-outline",
  },
  {
    id: "customization",
    label: LABELS.CUSTOMIZATION_TAB,
    icon: "color-palette-outline",
  },
] as const;

export const COLORS = {
  WHITE: "white",
} as const;

export const FORM_FIELDS = {
  TITLE: "title",
  DESCRIPTION: "description",
  PRIORITY: "priority",
  ESTIMATED_HOURS: "estimatedHours",
  CATEGORY: "category",
  START_DATE: "startDate",
  DUE_DATE: "dueDate",
  TAGS: "tags",
  CUSTOMIZATION: "customization",
  ATTACHMENTS: "attachments",
  IMAGES: "images",
  SUBTASKS: "subtasks",
} as const;

export const FORM_PLACEHOLDERS = {
  TITLE: "Entrez le titre de la tâche",
  DESCRIPTION: "Décrivez la tâche (optionnel)",
  ESTIMATED_HOURS: "Ex: 2.5",
  TAGS: "Ajouter des étiquettes",
  START_DATE: "Sélectionner la date de début",
  DUE_DATE: "Sélectionner la date d'échéance",
} as const;
