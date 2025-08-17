import {
  GoalFormData,
  GoalTypeOption,
  PeriodOption,
  PriorityOption,
} from "./types";

export const INITIAL_FORM_DATA: GoalFormData = {
  title: "",
  description: "",
  type: "scripts",
  period: "weekly",
  target: "",
  current: "",
  unit: "",
  category: "",
  priority: "medium",
  startDate: "",
  endDate: "",
};

export const GOAL_TYPES: GoalTypeOption[] = [
  { key: "scripts", label: "Scripts", icon: "document-text" },
  { key: "recordings", label: "Recordings", icon: "videocam" },
  { key: "duration", label: "Duration", icon: "time" },
  { key: "quality", label: "Quality", icon: "star" },
  { key: "consistency", label: "Consistency", icon: "trending-up" },
  { key: "collaboration", label: "Collaboration", icon: "people" },
];

export const PERIODS: PeriodOption[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

export const PRIORITIES: PriorityOption[] = [
  { key: "low", label: "Low", color: "#6b7280" },
  { key: "medium", label: "Medium", color: "#eab308" },
  { key: "high", label: "High", color: "#ef4444" },
];
