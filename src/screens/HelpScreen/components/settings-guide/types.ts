export interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: "display" | "recording" | "security" | "advanced" | "general";
  steps: string[];
  tips?: string;
  warning?: string;
}

export interface SettingCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
}

export type CategoryId =
  | "display"
  | "recording"
  | "security"
  | "advanced"
  | "general";
