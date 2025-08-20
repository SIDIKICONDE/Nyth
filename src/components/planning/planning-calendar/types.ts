import { PlanningEvent, Goal, Task } from "../../../types/planning";
import { CalendarItem } from "./hooks/usePlanningCalendar";

export interface PlanningCalendarProps {
  onEventPress?: (event: PlanningEvent) => void;
  onGoalPress?: (goal: Goal) => void;
  onTaskPress?: (task: Task) => void;
  onDatePress?: (date: Date) => void;
  onCreateEvent?: (date: Date) => void;
  onCreateGoal?: (date: Date) => void;
  onCreateTask?: (date: Date) => void;
}

export interface CalendarHeaderProps {
  currentDate: Date;
  onNavigateMonth: (direction: "prev" | "next") => void;
  onGoToToday: () => void;
}

export interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDatePress: (date: Date) => void;
  onDateLongPress?: (date: Date) => void;
  onEventPress?: (event: PlanningEvent) => void;
  onItemPress?: (item: CalendarItem) => void;
}

export interface DayNameHeaderProps {
  dayNames: string[];
}

export interface DayCellProps {
  date: Date | null;
  isToday: boolean;
  isSelected: boolean;
  events: PlanningEvent[];
  goals?: Goal[];
  tasks?: Task[];
  onPress?: (date: Date) => void;
  onLongPress?: (date: Date) => void;
  onEventPress?: (event: PlanningEvent) => void;
  onItemPress?: (item: CalendarItem) => void;
  hasItems: boolean;
}

export interface EventIndicatorProps {
  event: PlanningEvent;
  onPress?: (event: PlanningEvent) => void;
}

export interface EventCardProps {
  event: PlanningEvent;
  onPress?: (event: PlanningEvent) => void;
}
