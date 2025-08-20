import { Goal } from "../../../types/planning";

export interface GoalModalProps {
  visible: boolean;
  onClose: () => void;
  onGoalCreated?: (goalId: string) => void;
}

export interface GoalFormData {
  title: string;
  description: string;
  type: Goal["type"];
  period: Goal["period"];
  target: string;
  current: string;
  unit: string;
  category: string;
  priority: Goal["priority"];
  startDate: string;
  endDate: string;
}

export interface GoalTypeOption {
  key: Goal["type"];
  label: string;
  icon: string;
}

export interface PeriodOption {
  key: Goal["period"];
  label: string;
}

export interface PriorityOption {
  key: Goal["priority"];
  label: string;
  color: string;
}

export interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export interface TextInputFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  numberOfLines?: number;
}

export interface OptionSelectorProps<T> {
  options: T[];
  selectedValue: string;
  onSelect: (value: string) => void;
  renderOption: (option: T, isSelected: boolean) => React.ReactNode;
}
