import { Goal } from "../../../../types/planning";

export interface GoalsListProps {
  goals: Goal[];
  onGoalPress?: (goal: Goal) => void;
  onGoalEdit?: (goal: Goal) => void;
  onGoalDelete?: (goalId: string) => void;
  onGoalProgressUpdate?: (goalId: string, newCurrent: number) => void;
  onGoalComplete?: (goalId: string) => void;
  onGoalReactivate?: (goalId: string) => void;
  onCancelReminders?: (goalId: string) => void;
}

export interface ActionMenuProps {
  goal: Goal;
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onReactivate: () => void;
  onDelete: () => void;
  onCancelReminders: () => void;
}

export interface GoalCardProps {
  goal: Goal;
  onLongPress: () => void;
  onQuickIncrement: () => void;
  onQuickDecrement: () => void;
  onMarkComplete: () => void;
}

export interface EmptyStateProps {
  // Props pour l'état vide si nécessaire
}
