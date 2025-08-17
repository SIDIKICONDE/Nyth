export type TabType = "scripts" | "videos";

export interface HomeScreenState {
  activeTab: TabType;
  isInitialLoad: boolean;
  cacheSize: number;
  isClearingCache: boolean;
}

export interface NavigationHandlers {
  handleScriptPress: (scriptId: string) => void;
  handleRecordingPress: (recordingId: string) => Promise<void>;
  handleCreateScript: () => void;
  handleRecordVideo: (scriptId: string) => void;
  handleAIGenerate: () => void;
  handleAIChat: () => void;
  handlePlanning: () => void;
  // handleNodeEditor supprimé
  handleTabChange: (tab: TabType) => void;
  handleSettings: () => void;
  handlePreview: () => void;
}

export interface CacheManagement {
  cacheSize: number;
  isClearingCache: boolean;
  loadCacheSize: () => Promise<void>;
  handleClearCache: () => Promise<void>;
}

export interface HomeScreenProps {
  // Props si nécessaire pour les tests ou la composition
}
