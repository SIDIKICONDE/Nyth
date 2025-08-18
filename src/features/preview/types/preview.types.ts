import { Recording } from "@/types";
import { VideoMetadata } from "@/utils/videoMetadata";

export type ExportQuality = "480p" | "720p" | "1080p" | "4K";
export type ExportFormat = "mp4" | "mov";
export type NoiseReductionLevel = "none" | "light" | "medium" | "strong";

export interface AudioSettings {
  audioOptimization: boolean;
  noiseReduction: NoiseReductionLevel;
  autoGain: boolean;
  enhanceVoice: boolean;
  bassBoost: boolean;
  trebleBoost: boolean;
}

export interface PreviewState {
  recording: Recording | null;
  loading: boolean;
  isExporting: boolean;
  exportProgress: number;
  currentStep: string;
  videoSize: string;
  previewVideoUri: string | null;
  isGeneratingPreview: boolean;
  showSocialShare: boolean;
}

export interface ExportSettings {
  exportQuality: ExportQuality;
  exportFormat: ExportFormat;
  isAutoDetected: boolean;
  videoMetadata: VideoMetadata | null;
  sourceQuality: VideoMetadata["quality"] | "unknown";
}

export interface PreviewActions {
  handleExport: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleBasicShare: () => Promise<void>;
  handleDelete: () => void;
  setExportQuality: (quality: ExportQuality) => void;
  setExportFormat: (format: ExportFormat) => void;
}

export interface UsePreviewDataReturn extends PreviewState {
  setShowSocialShare: (show: boolean) => void;
  handleExport: () => void;
  handleShare: () => void;
  handleBasicShare: () => void;
  handleDelete: () => void;
  loadRecording: () => void;
}

export interface VideoPlayerSectionProps {
  recording: Recording;
  previewVideoUri: string | null;
  isGeneratingPreview: boolean;
  videoSize: string;
}

export interface ActionButtonsProps {
  isExporting: boolean;
  onExport: () => void;
  onBasicShare: () => void;
}

export interface ExportProgressBarProps {
  progress: number;
  currentStep: string;
}

export interface PreviewHeaderProps {
  recording: Recording;
  onBackPress: () => void;
  onHomePress: () => void;
}

export interface SocialShareModalProps {
  visible: boolean;
  onClose: () => void;
  videoUri: string;
  videoTitle: string;
  aspectRatio: {
    width: number;
    height: number;
  };
}
