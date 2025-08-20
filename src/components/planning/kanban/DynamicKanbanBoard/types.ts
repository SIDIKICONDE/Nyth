import {
  ColumnFormData,
  DynamicKanbanColumn,
  TaskWithDynamicStatus,
} from "../../../../types/planning";

export interface DynamicKanbanBoardProps {
  tasks?: TaskWithDynamicStatus[];
  onTaskMove?: (taskId: string, newColumnId: string) => void;
  onTaskPress?: (task: TaskWithDynamicStatus) => void;
  onTaskCreate?: (columnId: string) => void;
  onTaskEdit?: (task: TaskWithDynamicStatus) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (task: TaskWithDynamicStatus, newStatus: string) => void;
}

export interface AddColumnButtonProps {
  onPress: () => void;
  kanbanStyles: any;
  themeColors: any;
}

export interface ColumnListProps {
  columns: DynamicKanbanColumn[];
  getTasksForColumn: (columnId: string) => TaskWithDynamicStatus[];
  handleTaskMove: (taskId: string, newColumnId: string) => void;
  onTaskPress?: (task: TaskWithDynamicStatus) => void;
  onTaskCreate?: (columnId: string) => void;
  onTaskEdit?: (task: TaskWithDynamicStatus) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (task: TaskWithDynamicStatus, newStatus: string) => void;
  onColumnEdit: (column: DynamicKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  canDeleteColumn: (columnId: string) => boolean | undefined;
  kanbanStyles: any;
  onCycleColumnColor: (column: DynamicKanbanColumn) => void;
  onSelectColumnColor: (column: DynamicKanbanColumn, color: string) => void;
  availableColors: string[];
}

export interface ColumnModalManagerProps {
  visible: boolean;
  selectedColumn?: DynamicKanbanColumn;
  onClose: () => void;
  onSave: (formData: ColumnFormData) => Promise<void>;
  presetColors: string[];
  suggestedColor: string;
}

export interface UseTaskOrganizationProps {
  externalTasks?: TaskWithDynamicStatus[];
  getTasksByColumn: (columnId: string) => TaskWithDynamicStatus[];
}

export interface UseColumnActionsProps {
  createColumn: (formData: ColumnFormData) => Promise<DynamicKanbanColumn>;
  updateColumn: (columnId: string, formData: ColumnFormData) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  canDeleteColumn: (columnId: string) => boolean | undefined;
}
