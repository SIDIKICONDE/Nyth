export interface BiometricSettingsProps {
  // Props si nécessaire dans le futur
}

export interface BiometricOptionProps {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  isActive?: boolean;
}

export interface BiometricHeaderProps {
  isEnabled: boolean;
  isUpdating: string | null;
  onToggle: (value: boolean) => void;
}

export type UpdateKey = 'main' | 'requiredForApiKeys' | 'requiredForSettings' | null; 