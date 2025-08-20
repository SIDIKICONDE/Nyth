import { PlanningEvent } from "../../../types/planning";

export interface EventTimelineProps {
  events: PlanningEvent[];
  onEventPress?: (event: PlanningEvent) => void;
  onEventEdit?: (event: PlanningEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onEventStatusChange?: (
    eventId: string,
    status: PlanningEvent["status"]
  ) => void;
  onCreateEvent?: (date?: Date) => void;
  loading?: boolean;
  emptyStateMessage?: string;
  groupBy?: "date" | "status" | "type" | "priority";
  filterStatus?: PlanningEvent["status"][];
  filterType?: PlanningEvent["type"][];
  sortOrder?: "asc" | "desc";
}

export interface TimelineItemProps {
  event: PlanningEvent;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: (event: PlanningEvent) => void;
  showDate?: boolean;
}

export interface TimelineGroupProps {
  title: string;
  events: PlanningEvent[];
  onEventPress?: (event: PlanningEvent) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export interface EventDetailModalProps {
  visible: boolean;
  event: PlanningEvent | null;
  onClose: () => void;
  onEdit?: (event: PlanningEvent) => void;
  onDelete?: (eventId: string) => void;
  onStatusChange?: (eventId: string, status: PlanningEvent["status"]) => void;
}

export interface TimelineFilterProps {
  filterStatus: PlanningEvent["status"][];
  filterType: PlanningEvent["type"][];
  groupBy: "date" | "status" | "type" | "priority";
  sortOrder: "asc" | "desc";
  onFilterStatusChange: (status: PlanningEvent["status"][]) => void;
  onFilterTypeChange: (types: PlanningEvent["type"][]) => void;
  onGroupByChange: (groupBy: "date" | "status" | "type" | "priority") => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
  onReset: () => void;
}

export interface StatusBadgeProps {
  status: PlanningEvent["status"];
  size?: "small" | "medium" | "large";
}

export interface PriorityIndicatorProps {
  priority: PlanningEvent["priority"];
  size?: "small" | "medium" | "large";
}

export interface EventTypeIconProps {
  type: PlanningEvent["type"];
  size?: number;
  color?: string;
}

export interface TimelineEmptyStateProps {
  message?: string;
  onCreateEvent?: () => void;
}

export interface EventActionsProps {
  event: PlanningEvent;
  onEdit?: (event: PlanningEvent) => void;
  onDelete?: (eventId: string) => void;
  onStatusChange?: (eventId: string, status: PlanningEvent["status"]) => void;
  onDuplicate?: (event: PlanningEvent) => void;
}

export interface GroupedEvents {
  [key: string]: PlanningEvent[];
}

export interface TimelineStats {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  cancelled: number;
  postponed: number;
  byType: Record<PlanningEvent["type"], number>;
  byPriority: Record<PlanningEvent["priority"], number>;
}
