import { Goal, PlanningEvent } from "../../../../types/planning";

export type TabType = "events" | "goals";

export interface TimelineTabContentProps {
  onEventPress?: (event: PlanningEvent) => void;
  onEventEdit?: (event: PlanningEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onEventStatusChange?: (
    eventId: string,
    newStatus: PlanningEvent["status"]
  ) => void;
  onCreateEvent?: (date?: Date) => void;
  onGoalPress?: (goal: Goal) => void;
  onGoalProgressUpdate?: (goalId: string, newCurrent: number) => void;
  onGoalComplete?: (goalId: string) => void;
  onGoalDelete?: (goalId: string) => void;
  onGoalReactivate?: (goalId: string) => void;
  onCancelReminders?: (goalId: string) => void;
  onSubTabChange?: (subTab: string) => void;
  onCreateGoal?: () => void;
}

export interface TabButtonProps {
  tab: TabType;
  icon: string;
  label: string;
  count: number;
  isActive: boolean;
  onPress: (tab: TabType) => void;
}

export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  eventsCount: number;
  goalsCount: number;
}

export interface TabContentProps {
  activeTab: TabType;
  events: PlanningEvent[];
  goals: Goal[];
  eventHandlers: {
    onEventPress?: (event: PlanningEvent) => void;
    onEventEdit?: (event: PlanningEvent) => void;
    onEventDelete?: (eventId: string) => void;
    onEventStatusChange?: (
      eventId: string,
      newStatus: PlanningEvent["status"]
    ) => void;
    onCreateEvent?: (date?: Date) => void;
  };
  goalHandlers: {
    onGoalPress?: (goal: Goal) => void;
    onGoalEdit?: (goal: Goal) => void;
    onGoalDelete?: (goalId: string) => void;
    onGoalProgressUpdate?: (goalId: string, newCurrent: number) => void;
    onGoalComplete?: (goalId: string) => void;
    onGoalReactivate?: (goalId: string) => void;
    onCancelReminders?: (goalId: string) => void;
  };
  onCreateGoal?: () => void;
}
