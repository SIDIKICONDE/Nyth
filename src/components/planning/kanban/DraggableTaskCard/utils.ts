import { Task } from "../../../../types/planning";

export const getPriorityColor = (priority: Task["priority"]): string => {
  switch (priority) {
    case "urgent":
      return "#DC2626";
    case "high":
      return "#EF4444";
    case "medium":
      return "#F59E0B";
    case "low":
      return "#10B981";
    default:
      return "#6B7280";
  }
};

export const getPriorityIcon = (priority: Task["priority"]): string => {
  switch (priority) {
    case "urgent":
      return "🚨";
    case "high":
      return "🔴";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("fr-FR", {
    month: "short",
    day: "numeric",
  });
};

export const isTaskOverdue = (dueDate?: string | Date): boolean => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};
