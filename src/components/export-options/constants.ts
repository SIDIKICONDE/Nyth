import { QualityOption } from "./types";

// Fonction pour obtenir les options de qualité avec traductions
export const getQualityOptions = (
  t: (key: string, fallback: string) => string
): QualityOption[] => [
  { value: "480p", label: t("exportOptions.quality.low", "Low (480p)") },
  { value: "720p", label: t("exportOptions.quality.medium", "Medium (720p)") },
  { value: "1080p", label: t("exportOptions.quality.high", "High (1080p)") },
  { value: "4K", label: t("exportOptions.quality.ultra", "Ultra (4K)") },
];

// Options de qualité statiques (pour compatibilité)
export const QUALITY_OPTIONS: QualityOption[] = [
  { value: "480p", label: "480p" },
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "4K", label: "4K" },
];

export const DEFAULT_ASPECT_RATIO = 16 / 9;

export const QUALITY_TO_HEIGHT_MAP = {
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
  "4K": 2160,
} as const;
