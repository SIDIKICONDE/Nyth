import { Task, TaskCustomization } from "../../../../types/planning";

export interface TaskCardProps {
  task: Task & { customization?: TaskCustomization };
  onPress?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (task: Task, newStatus: string) => void;
  onLongPress?: () => void;
  isDragging?: boolean;
  customStyles?: any;
}

export interface CardHeaderProps {
  task: Task;
  cardIcon: string;
  onEdit: () => void;
  themeColors: any;
}

export interface CardContentProps {
  task: Task;
  customization: TaskCustomization;
  themeColors: any;
  cardColor: string;
}

export interface CardFooterProps {
  task: Task;
  showEstimatedTime: boolean;
  themeColors: any;
}

export interface MinimalCardProps extends TaskCardProps {
  cardColor: string;
  cardIcon: string;
  themeColors: any;
}

export interface DetailedCardProps extends TaskCardProps {
  cardColor: string;
  cardIcon: string;
  customization: TaskCustomization;
  themeColors: any;
}

export interface CreativeCardProps extends TaskCardProps {
  cardColor: string;
  cardIcon: string;
  customization: TaskCustomization;
  themeColors: any;
}

export interface DefaultCardProps extends TaskCardProps {
  cardColor: string;
  cardIcon: string;
  customization: TaskCustomization;
  themeColors: any;
}

export interface MetadataProps {
  task: Task;
  showEstimatedTime: boolean | undefined;
  themeColors: any;
}

export interface ProgressBarProps {
  status: Task["status"];
  cardColor: string;
  themeColors: any;
}

export interface TagsProps {
  tags: string[];
  cardColor: string;
  themeColors: any;
}
