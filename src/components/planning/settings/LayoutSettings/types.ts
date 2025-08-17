export interface PresetData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  values: string;
}

export interface NavigationSection {
  id: string;
  label: string;
  icon: string;
}

export interface ToggleSetting {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface PresetCardProps {
  preset: PresetData;
  onPress: (presetId: string) => void;
  themeColors: any;
  isSelected?: boolean;
  isApplying?: boolean;
}

export interface NavigationTabsProps {
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  themeColors: any;
}

export interface SettingControlProps {
  label: string;
  currentValue: number;
  values: number[];
  unit: string;
  onValueChange: (value: number) => void;
  themeColors: any;
}

export interface ToggleControlProps {
  setting: ToggleSetting;
  onToggle: (key: string, value: boolean) => void;
  themeColors: any;
}

export interface SectionProps {
  themeColors: any;
}

export interface PresetsSectionProps extends SectionProps {
  onPresetSelect: (presetId: string) => void;
  presets: PresetData[];
  selectedPreset?: string;
  isApplyingPreset?: boolean;
}

export interface LayoutSettingsProps {
  // Props peuvent être ajoutées si nécessaire dans le futur
}
