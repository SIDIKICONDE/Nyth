export interface NavigationHandlers {
  handleScriptPress: (scriptId: string) => void;
  handleRecordingPress: (recordingId: string) => void;
  handleCreateScript: () => void;
  handleRecordVideo: (scriptId: string) => void;
  handleAIGenerate: () => void;
  handleAIChat: () => void;
  handlePlanning: () => void;
  handleAudioScreen: () => void;
  handlePreview: () => void;
  handleTabChange: (tab: TabType) => void;
  handleSettings: () => void;
}
