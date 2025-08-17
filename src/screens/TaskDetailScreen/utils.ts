import { Task } from "../../types/planning";
import { STATUS_OPTIONS } from "./constants";

export const getStatusIndex = (status: Task["status"]) => {
  return STATUS_OPTIONS.findIndex((option) => option.value === status);
};

export const getStatusFromIndex = (index: number): Task["status"] => {
  return STATUS_OPTIONS[index]?.value || "todo";
};

export const formatDate = (date?: Date, locale: string = "fr-FR") => {
  if (!date) return "Non défini";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

export const getPriorityColor = (
  priority: Task["priority"],
  themeColors: any
) => {
  switch (priority) {
    case "urgent":
      return themeColors.error;
    case "high":
      return "#FF8C00";
    case "medium":
      return themeColors.warning;
    case "low":
      return themeColors.success;
    default:
      return themeColors.textSecondary;
  }
};
