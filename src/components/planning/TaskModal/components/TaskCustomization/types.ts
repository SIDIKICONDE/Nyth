export interface TaskCustomizationProps {
  cardColor?: string;
  cardIcon?: string;
  cardStyle?: "default" | "minimal" | "detailed" | "creative";
  showEstimatedTime?: boolean;
  showProgress?: boolean;
  showAttachments?: boolean;
  showSubtasks?: boolean;
  onColorChange: (color: string) => void;
  onIconChange: (icon: string) => void;
  onStyleChange: (style: string) => void;
  onFeatureToggle: (feature: string, enabled: boolean) => void;
}

export interface CardColor {
  id: string;
  name: string;
  color: string;
}

export interface CardStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export interface FeatureToggle {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface NavigationSection {
  id: string;
  label: string;
  icon: string;
}

export interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  colors: CardColor[];
}

export interface IconPickerProps {
  selectedIcon: string;
  onIconSelect: (icon: string) => void;
  icons: string[];
}

export interface StylePickerProps {
  selectedStyle: string;
  onStyleSelect: (style: string) => void;
  styles: CardStyle[];
}

export interface FeatureTogglesProps {
  features: FeatureToggle[];
  onToggle: (feature: string, enabled: boolean) => void;
}

export interface SectionNavigationProps {
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (section: string) => void;
}
