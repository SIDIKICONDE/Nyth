import { ExportQuality } from "@/components/export-options/types";
import { VideoQuality } from "@/types/video";

/**
 * Convertit une valeur VideoQuality (ou chaîne équivalente) vers l'ExportQuality utilisé pour l'UI.
 */
export const toExportQuality = (
  videoQuality: VideoQuality | string
): ExportQuality => {
  switch (videoQuality) {
    case VideoQuality["2160p"]:
    case "2160p":
    case "4K":
      return "4K";
    case VideoQuality["1080p"]:
    case "1080p":
      return "1080p";
    case VideoQuality["720p"]:
    case "720p":
      return "720p";
    case VideoQuality["480p"]:
    case "480p":
      return "480p";

    default:
      return "1080p";
  }
};

/**
 * Convertit une ExportQuality vers la valeur VideoQuality utilisée par l'API Camera.
 */
export const toVideoQuality = (
  exportQuality: ExportQuality | string
): VideoQuality => {
  switch (exportQuality) {
    case "4K":
    case "2160p":
      return VideoQuality["2160p"];
    case "1080p":
      return VideoQuality["1080p"];
    case "720p":
      return VideoQuality["720p"];
    case "480p":
      return VideoQuality["480p"];

    default:
      return VideoQuality["720p"];
  }
};

/**
 * Retourne une représentation lisible (label) pour l'affichage.
 */
export const toDisplayQuality = (
  quality: VideoQuality | ExportQuality | string
): string => {
  const mapped = typeof quality === "string" ? quality : String(quality);
  if (mapped === "2160p") return "4K";
  return mapped.toUpperCase();
};
