import { Task } from "../../types/planning";

export interface TaskDetailScreenProps {
  route: {
    params: {
      taskId: string;
    };
  };
}

export interface TaskDetailHeaderProps {
  task: Task;
  onGoBack: () => void;
  onMenuPress: () => void;
}

export interface TaskStatusSliderProps {
  task: Task;
  onStatusChange: (status: Task["status"]) => void;
}

export interface TaskDetailsCardProps {
  task: Task;
}

export interface TaskAttachmentsCardProps {
  task: Task;
}

export interface TaskMenuOverlayProps {
  visible: boolean;
  showStatusSection: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatusSection: () => void;
}
