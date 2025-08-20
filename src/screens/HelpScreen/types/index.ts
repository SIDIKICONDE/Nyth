export interface TutorialCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  duration: string;
  action: () => void;
}

export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: [string, string];
}

export interface Tip {
  id: string;
  icon: string;
  text: string;
}

export interface HelpContent {
  type: "text" | "list" | "steps" | "warning" | "tip";
  content: string | string[];
  title?: string;
}

export interface HelpItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: "basics" | "advanced" | "troubleshooting" | "tips";
  content: HelpContent[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "technical" | "account" | "billing";
  icon: string;
  color: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
}

export interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: "display" | "recording" | "security" | "advanced";
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

export type SectionType =
  | "tutorials"
  | "documentation"
  | "quickhelp"
  | "settings"
  | "planning"
  | "aichat";
