import { Task } from "../../../../types/planning";

export const getProgressPercentage = (status: Task["status"]): number => {
  switch (status) {
    case "completed":
      return 100;
    case "review":
      return 80;
    case "in_progress":
      return 50;
    case "todo":
      return 10;
    default:
      return 0;
  }
};

export const formatStatus = (status: string): string => {
  return status.replace("_", " ");
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

export const getCardTransform = (isDragging: boolean): any => {
  return [{ scale: isDragging ? 0.95 : 1 }];
};

export const getCardOpacity = (isDragging: boolean): number => {
  return isDragging ? 0.8 : 1;
};
