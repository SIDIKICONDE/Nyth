// Main component
export { GoalModal } from "./GoalModal";
export type { GoalFormData, GoalModalProps } from "./types";

// Components
export { DateField, DateRangeFields } from "./components/DateField";
export { GoalTypeSelector } from "./components/GoalTypeSelector";
export { ModalContent } from "./components/ModalContent";
export { ModalHeader } from "./components/ModalHeader";
export { PeriodSelector } from "./components/PeriodSelector";
export { PrioritySelector } from "./components/PrioritySelector";
export { TargetUnitRow } from "./components/TargetUnitRow";
export { TextInputField } from "./components/TextInputField";

// Hooks
export { useCreateGoal } from "./hooks/useCreateGoal";
export { useModalAnimations } from "./hooks/useModalAnimations";

// Types
export * from "./types";

// Constants
export { GOAL_TYPES, PERIODS, PRIORITIES } from "./constants";

// Utils
export { validateFormData as validateGoalForm } from "./utils";
export {
  calculateProgress,
  getProgressColor,
  getProgressMessage,
} from "./utils/progressCalculator";

// Styles
export * from "./styles";
