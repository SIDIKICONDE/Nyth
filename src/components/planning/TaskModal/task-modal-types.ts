export type TabType = "details" | "customization";

export interface TaskModalHeaderProps {
  title: string;
  isValid: boolean;
  hasChanges: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: () => void;
}

export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export interface DetailsTabProps {
  formState: any;
  updateField: (field: any, value: any) => void;
}

export interface CustomizationTabProps {
  formState: any;
  updateField: (field: any, value: any) => void;
}

export interface Tab {
  id: TabType;
  label: string;
  icon: string;
}
