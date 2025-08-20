export const PRIORITY_COLORS = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
} as const;

export const PRIORITY_ICONS = {
  high: "🔴",
  medium: "🟡",
  low: "🟢",
} as const;

export const STATUS_COLORS = {
  active: "#10B981",
  completed: "#10B981", // Vert pour indiquer le succès
  paused: "#F59E0B",
  cancelled: "#EF4444",
} as const;

export const GOAL_CARD_CONFIG = {
  padding: 10,
  borderRadius: 10,
  progressCircleSize: 32,
  progressBarHeight: 3,
  actionButtonMinWidth: 28,
} as const;

export const ANIMATION_CONFIG = {
  activeOpacity: 0.7,
  modalFadeOpacity: 0.5,
} as const;
