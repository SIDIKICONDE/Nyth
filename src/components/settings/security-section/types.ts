export interface SecuritySettings {
  enhancedSecurity: boolean;
  bypassProtection: boolean;
}

export interface SecuritySectionProps {
  // Props si nécessaire dans le futur
}

export interface SecurityToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  isEnabled?: boolean;
} 