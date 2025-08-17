import { RecordingSettings, Script } from "../../../types";
import { VideoSettings } from "../../../types/video";

export interface SettingsState {
  settings: RecordingSettings;
  script: Script | null;
  isSettingsLoaded: boolean;
  expandedSection: string | null;
  cacheSize: number;
  isClearingCache: boolean;
  isSaving: boolean;
  isSigningOut: boolean;
}

export interface SettingsActions {
  updateSetting: <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => void;
  updateVideoSettings: (newVideoSettings: VideoSettings) => void;
  saveSettings: () => Promise<void>;
  saveSettingsOnly: () => Promise<void>;
  resetToDefaults: () => void;
  applyDeviceRecommendations: () => void;
  toggleSectionExpand: (section: string) => void;
}

export interface CacheActions {
  loadCacheSize: () => Promise<void>;
  handleClearCache: () => void;
}

export interface SettingsSectionProps {
  settings: RecordingSettings;
  onUpdateSetting: <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => void;
  scriptId?: string;
}

export interface RecordingSectionProps extends SettingsSectionProps {
  videoSettings?: VideoSettings;
  onVideoSettingsChange: (newVideoSettings: VideoSettings) => void;
}

export interface ResetSectionProps {
  onClearCache: () => void;
  isClearingCache: boolean;
  cacheSize?: string;
}

export interface SettingsFooterProps {
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
}
