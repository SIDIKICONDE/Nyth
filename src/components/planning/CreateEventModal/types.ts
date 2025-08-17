import { PlanningEvent } from "../../../types/planning";

export interface EventModalProps {
  visible: boolean;
  event?: PlanningEvent | null;
  onClose: () => void;
  onCreate: (
    eventData: Omit<PlanningEvent, "id" | "createdAt" | "updatedAt" | "userId">
  ) => Promise<void>;
  onSave: (eventId: string, updates: Partial<PlanningEvent>) => Promise<void>;
  selectedDate?: Date; // used only in create mode
}

export const isEditMode = (
  event?: PlanningEvent | null
): event is PlanningEvent => !!event;
