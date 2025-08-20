import { Task } from "../../../../types/planning";

export interface KanbanColumnProps {
  id: Task["status"] | string;
  title: string;
  color: string;
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task["status"] | string) => void;
  onTaskPress?: (task: Task) => void;
  onTaskCreate: () => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange?: (task: Task, newStatus: string) => void;
  customStyles?: {
    column: any;
    card: any;
  };
  onColumnEdit?: () => void;
  onColumnDelete?: () => void;
  onCycleColor?: () => void;
  availableColors?: string[];
  onSelectColor?: (color: string) => void;
  canDelete?: boolean;
  description?: string;
  maxTasks?: number;
  icon?: string;
  borderStyle?: "solid" | "dashed" | "gradient";
}

export interface ColumnHeaderProps {
  title: string;
  color: string;
  description?: string;
  tasksCount: number;
  maxTasks?: number;
  onColumnEdit?: () => void;
  onColumnDelete?: () => void;
  onCycleColor?: () => void;
  availableColors?: string[];
  onSelectColor?: (color: string) => void;
  themeColors: any;
  icon?: string;
  borderStyle?: "solid" | "dashed" | "gradient";
}

export interface ColumnBadgeProps {
  color: string;
  count: number;
  maxTasks?: number;
}

export interface ColumnMenuProps {
  onColumnEdit?: () => void;
  onColumnDelete?: () => void;
  onCycleColor?: () => void;
  availableColors?: string[];
  onSelectColor?: (color: string) => void;
  themeColors: any;
}

export interface LimitWarningProps {
  color: string;
  maxTasks: number;
  isVisible: boolean;
}

export interface TasksListProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange?: (task: Task, newStatus: string) => void;
  customStyles?: {
    column: any;
    card: any;
  };
}

export interface AddTaskButtonProps {
  onTaskCreate: () => void;
  color: string;
  isAtMaxCapacity: boolean;
  themeColors: any;
}
