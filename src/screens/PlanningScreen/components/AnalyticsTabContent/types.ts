export type PeriodType = "week" | "month" | "quarter" | "year";

export interface LocalAnalytics {
  totalEvents: number;
  eventsCompleted: number;
  eventsInProgress: number;
  eventsPlanned: number;
  eventsOverdue: number;
  completionRate: number;
  totalGoals: number;
  goalsCompleted: number;
  goalsActive: number;
  goalCompletionRate: number;
  // Données des tâches
  totalTasks: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksTodo: number;
  tasksBlocked: number;
  tasksOverdue: number;
  taskCompletionRate: number;
  periodEvents: any[];
  allEvents: number;
}

export interface PeriodOption {
  key: PeriodType;
  label: string;
  icon: string;
}
