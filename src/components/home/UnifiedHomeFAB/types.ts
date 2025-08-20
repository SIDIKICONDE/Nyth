import { Script } from "@/types";

export type TabType = "scripts" | "videos";

export interface UnifiedHomeFABProps {
  activeTab: TabType;
  scripts: Script[];
  onCreateScript: () => void;
  onRecordVideo: (scriptId: string) => void;
  onAIGenerate: () => void;
  onAIChat: () => void;
  onPlanning: () => void;
  onNotes?: () => void;
  // onNodeEditor supprimé
}

export type FABDesignType = "stacked" | "orbital" | "hamburger";

export interface FABAction {
  id: string;
  label: string;
  icon?: string;
  iconComponent?: React.ReactNode;
  color?: string;
  onPress: () => void;
}

export interface UserQuickAction {
  icon: string;
  label: string;
  route: string;
  color?: string;
}
