import { Task } from "../../types/planning";

export const STATUS_OPTIONS = [
  {
    value: "todo" as Task["status"],
    label: "À faire",
    icon: "radio-button-off",
    color: "#6B7280",
  },
  {
    value: "in_progress" as Task["status"],
    label: "En cours",
    icon: "play-circle",
    color: "#3B82F6",
  },
  {
    value: "review" as Task["status"],
    label: "En révision",
    icon: "eye",
    color: "#F59E0B",
  },
  {
    value: "completed" as Task["status"],
    label: "Terminé",
    icon: "checkmark-circle",
    color: "#10B981",
  },
  {
    value: "blocked" as Task["status"],
    label: "Bloqué",
    icon: "ban",
    color: "#EF4444",
  },
];

export const PRIORITY_LABELS = {
  urgent: "Urgent",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
} as const;
