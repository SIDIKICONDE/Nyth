import {
  ExportQuality,
  ExportFormat,
  NoiseReductionLevel,
} from "../types/preview.types";

export const DEFAULT_EXPORT_QUALITY: ExportQuality = "1080p";
export const DEFAULT_EXPORT_FORMAT: ExportFormat = "mp4";
export const DEFAULT_NOISE_REDUCTION: NoiseReductionLevel = "none";

export const LOADING_DELAY = 1000;
export const EXPORT_PROGRESS_INTERVAL = 200;

export const VIDEO_SIZE_UNITS = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
} as const;
