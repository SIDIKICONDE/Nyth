export type ExportQuality = "480p" | "720p" | "1080p" | "4K";
export type ExportFormat = "mp4" | "mov";

export interface ExportOptionsProps {
  exportQuality: ExportQuality;
  setExportQuality: (quality: ExportQuality) => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  aspectRatio: { width: number; height: number };
  isAutoDetected?: boolean;
}

export interface VideoDimensions {
  width: number;
  height: number;
}

export interface QualityOption {
  value: ExportQuality;
  label: string;
}
