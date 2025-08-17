import { Recording } from "../../../types";
import { VideoMetadata } from "../../../utils/videoMetadata";

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

export interface UsePreviewDataReturn {
  // États de base
  recording: Recording | null;
  loading: boolean;
  isExporting: boolean;
  exportProgress: number;
  currentStep: string;
  videoSize: string;
  previewVideoUri: string | null;
  isGeneratingPreview: boolean;
  showSocialShare: boolean;

  // Setters
  setShowSocialShare: (show: boolean) => void;

  // Actions
  handleExport: () => void;
  handleShare: () => void;
  handleBasicShare: () => void;
  handleDelete: () => void;
}
