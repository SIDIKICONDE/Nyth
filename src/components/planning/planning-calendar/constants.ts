export const PRIORITY_COLORS = {
  urgent: "#ef4444", // Rouge
  high: "#f97316", // Orange
  medium: "#eab308", // Jaune
  low: "#22c55e", // Vert
} as const;

export const EVENT_TYPE_ICONS = {
  script_creation: "document-text",
  recording: "videocam",
  editing: "cut",
  review: "eye",
  meeting: "people",
  deadline: "alarm",
} as const;

export const MAX_VISIBLE_EVENTS = 3;
