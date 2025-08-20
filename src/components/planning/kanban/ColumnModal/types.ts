import {
  DynamicKanbanColumn,
  ValidationOptions,
} from "../../../../types/planning";

export interface ColumnFormData {
  title: string;
  description?: string;
  color: string;
  maxTasks?: number;
  icon?: string;
  borderStyle?: "solid" | "dashed" | "gradient";
  autoProgress?: boolean;
  validationRules?: string;
  validationOptions?: ValidationOptions;
  template?: string;
  workflowRules?: WorkflowRule[];
}

export interface WorkflowRule {
  id: string;
  type: "auto_move" | "validation" | "notification" | "time_limit";
  condition: string;
  action: string;
  enabled: boolean;
}

export interface ColumnModalProps {
  visible: boolean;
  column?: DynamicKanbanColumn;
  onClose: () => void;
  onSave: (formData: ColumnFormData) => Promise<void>;
  presetColors: string[];
  suggestedColor?: string;
}

export interface AdvancedOptionsProps {
  maxTasks?: number;
  onMaxTasksChange?: (maxTasks?: number) => void;
  icon?: string;
  onIconChange?: (icon: string) => void;
  borderStyle?: string;
  onBorderStyleChange?: (borderStyle: string) => void;
  autoProgress?: boolean;
  onAutoProgressChange?: (autoProgress: boolean) => void;
  validationRules?: string;
  onValidationRulesChange?: (rules: string) => void;
  validationOptions?: ValidationOptions;
  onValidationOptionsChange?: (options: ValidationOptions) => void;
}

// ColorPickerProps supprimé (remplacé par NativeColorPickerField)

export interface ColumnFormFieldsProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export interface TipsSectionProps {}

export interface UseColumnFormReturn {
  formData: ColumnFormData;
  isSaving: boolean;
  updateField: <K extends keyof ColumnFormData>(
    field: K,
    value: ColumnFormData[K]
  ) => void;
  handleSave: () => Promise<void>;
  isValid: boolean;
}

export interface UseColumnFormProps {
  visible: boolean;
  column?: DynamicKanbanColumn;
  suggestedColor?: string;
  onSave: (formData: ColumnFormData) => Promise<void>;
  onClose: () => void;
}
