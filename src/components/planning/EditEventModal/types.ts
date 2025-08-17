import { PlanningEvent } from "../../../types/planning";

export interface EditEventModalProps {
  visible: boolean;
  event: PlanningEvent | null;
  onClose: () => void;
  onSave: (eventId: string, updates: Partial<PlanningEvent>) => Promise<void>;
}

export interface EditEventHeaderProps {
  title: string;
  isLoading: boolean;
  isValid: boolean;
  onClose: () => void;
  onSave: () => void;
}

export interface EventFormFieldsProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export interface EventInfoProps {
  event: PlanningEvent;
}
