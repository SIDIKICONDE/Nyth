export const PRIORITY_COLORS = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
  urgent: "#DC2626",
} as const;

export const STATUS_COLORS = {
  todo: "#6B7280",
  in_progress: "#3B82F6",
  review: "#8B5CF6",
  completed: "#10B981",
  blocked: "#EF4444",
} as const;

export const DEFAULT_CUSTOMIZATION = {
  cardColor: "",
  cardIcon: "💼",
  cardStyle: "default",
  showEstimatedTime: true,
  showProgress: true,
  showAttachments: true,
  showSubtasks: false,
} as const;
