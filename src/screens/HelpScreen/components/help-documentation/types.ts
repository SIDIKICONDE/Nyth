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

export interface Category {
  id: string;
  title: string;
  icon: string;
  color: string;
}

export interface HelpDocumentationSectionProps {
  onClose?: () => void;
}
