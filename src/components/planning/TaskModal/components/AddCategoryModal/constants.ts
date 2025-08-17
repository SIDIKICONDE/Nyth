export const EMOJI_OPTIONS = [
  "📁",
  "💼",
  "🎯",
  "⚡",
  "🔥",
  "💡",
  "🎨",
  "🔧",
  "📊",
  "🚀",
  "💻",
  "📱",
  "🎵",
  "📚",
  "✍️",
  "🏃",
  "💪",
  "🍳",
  "🛒",
  "🏠",
];

export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 30,
  DESCRIPTION_MAX_LENGTH: 100,
} as const;

export const DEFAULT_VALUES = {
  ICON: "📁",
  NAME: "",
  DESCRIPTION: "",
} as const;
