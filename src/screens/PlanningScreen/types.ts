import { Goal, PlanningEvent } from "../../types/planning";

export type TabType = "timeline" | "tasks" | "calendar" | "teams" | "analytics";

export interface Tab {
  key: TabType;
  title: string;
  icon: string;
}

export interface PlanningScreenHeaderProps {
  activeTab: TabType;
  activeSubTab?: string;
  onCreateEvent: () => void;
  onCreateGoal: () => void;
  onOpenSettings: () => void;
}

export interface PlanningScreenTabsProps {
  tabs: Tab[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export interface TimelineTabContentProps {
  onEventPress: (event: PlanningEvent) => void;
  onEventEdit: (event: PlanningEvent) => void;
  onEventDelete: (eventId: string) => void;
  onEventStatusChange: (
    eventId: string,
    status: PlanningEvent["status"]
  ) => void;
  onGoalPress?: (goal: Goal) => void;
  onGoalProgressUpdate?: (goalId: string, newCurrent: number) => void;
  onGoalComplete?: (goalId: string) => void;
  onGoalDelete?: (goalId: string) => void;
  onGoalReactivate?: (goalId: string) => void;
}

export interface CalendarTabContentProps {
  onEventPress: (event: PlanningEvent) => void;
  onDatePress: (date: Date) => void;
  onCreateEvent: (date: Date) => void;
}
