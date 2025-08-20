export const UI_CONFIG = {
  HEADER_ICON_SIZE: 16,
  CHEVRON_SIZE: 18,
  CHAT_ICON_SIZE: 20,
  SUGGESTION_CHEVRON_SIZE: 16,
} as const;

export const SPACING = {
  CONTAINER_MARGIN_HORIZONTAL: 16,
  CONTAINER_MARGIN_VERTICAL: 6,
  HEADER_PADDING: 12,
  CONTENT_PADDING_HORIZONTAL: 16,
  CONTENT_PADDING_BOTTOM: 16,
  SECTION_MARGIN_BOTTOM: 16,
  SECTION_TITLE_MARGIN_BOTTOM: 8,
  SUGGESTION_MARGIN_BOTTOM: 8,
  INSIGHT_MARGIN_BOTTOM: 8,
  HEADER_LEFT_GAP: 6,
  CHAT_BUTTON_GAP: 8,
  CHAT_BUTTON_MARGIN_TOP: 8,
  QUICK_ACTIONS_MARGIN: -4,
  ACTION_BUTTON_MARGIN: 4,
} as const;

export const STYLING = {
  BORDER_RADIUS_CONTAINER: 12,
  BORDER_RADIUS_CARDS: 8,
  BORDER_RADIUS_ACTIONS: 20,
  SHADOW_OFFSET: { width: 0, height: 2 },
  SHADOW_OPACITY: 0.1,
  SHADOW_RADIUS: 4,
  ELEVATION: 2,
  BORDER_WIDTH: 1,
  BORDER_LEFT_WIDTH: 3,
  ACTION_MIN_WIDTH: 120,
} as const;

export const LABELS = {
  HEADER_TITLE: "IA",
  SUGGESTIONS_TITLE: "💡 Suggestions",
  OVERVIEW_TITLE: "📊 Aperçu",
  QUICK_ACTIONS_TITLE: "🚀 Actions rapides",
  CHAT_BUTTON_TEXT: "Discuter avec l'IA",
  DEFAULT_CHAT_MESSAGE: "Aide-moi avec ma planification",
  COMPLETION_SUFFIX: "% de réussite",
  EVENTS_COMPLETED_TEXT: "événements terminés",
  OVERDUE_WARNING: "⚠️ Événements en retard",
} as const;

export const ICONS = {
  HEADER: "sparkles" as const,
  CHEVRON_UP: "chevron-up" as const,
  CHEVRON_DOWN: "chevron-down" as const,
  CHEVRON_FORWARD: "chevron-forward" as const,
  CHAT: "chatbubbles" as const,
} as const;

export const COLORS = {
  WHITE: "white",
  BORDER_COLOR: "#E5E7EB",
  PRIMARY_BORDER: "#3B82F6",
  PRIMARY_OPACITY_10: "10",
  PRIMARY_OPACITY_20: "20",
} as const;
