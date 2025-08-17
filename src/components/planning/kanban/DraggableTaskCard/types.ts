import { Task } from "../../../../types/planning";

export interface DraggableTaskCardProps {
  task: Task;
  onDragStart: (taskId: string) => void;
  onDragEnd: (taskId: string, dropZone?: string) => void;
  onTaskPress: (task: Task) => void;
}

export interface TaskCardHeaderProps {
  task: Task;
  priorityColor: string;
  priorityIcon: string;
  isOverdue: boolean;
  themeColors: any;
}

export interface TaskCardContentProps {
  task: Task;
  themeColors: any;
}

export interface TaskCardFooterProps {
  task: Task;
  themeColors: any;
}

export interface TaskCardTagsProps {
  tags: string[];
  themeColors: any;
  primaryColor: string;
}

export interface GestureContext extends Record<string, unknown> {
  startX: number;
  startY: number;
}
