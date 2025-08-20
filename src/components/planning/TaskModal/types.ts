import { Task, TaskFormData } from "../../../types/planning";

export interface TaskModalProps {
  visible: boolean;
  task?: Task; // Si fourni, on est en mode édition
  initialStatus?: Task["status"]; // Pour créer avec un statut spécifique
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
}

export type TaskFormErrors = Partial<Record<keyof TaskFormData, string>>;

export interface TaskFormState extends TaskFormData {
  errors: TaskFormErrors;
}

export interface TaskFormFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  required?: boolean;
  style?: any;
}

export interface PriorityPickerProps {
  value: Task["priority"];
  onValueChange: (priority: Task["priority"]) => void;
  error?: string;
}

export interface DatePickerFieldProps {
  label: string;
  value?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
}

export interface TagInputProps {
  value: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  category?: string; // Catégorie de la tâche pour suggestions contextuelles
}

export interface CategoryPickerProps {
  value?: string;
  onCategoryChange: (categoryId: string) => void;
  error?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  isCustom?: boolean;
}
