import { VideoQuality } from "../../../types/video";
import { ExportQuality } from "../types";

export const convertVideoQualityToExportQuality = (
  videoQuality: any
): ExportQuality => {
  if (
    videoQuality === VideoQuality["2160p"] ||
    videoQuality === "2160p" ||
    videoQuality === "4K"
  ) {
    return "4K";
  } else if (
    videoQuality === VideoQuality["1080p"] ||
    videoQuality === "1080p"
  ) {
    return "1080p";
  } else if (videoQuality === VideoQuality["720p"] || videoQuality === "720p") {
    return "720p";
  } else if (videoQuality === VideoQuality["480p"] || videoQuality === "480p") {
    return "480p";
  }

  // Valeur par défaut
  return "1080p";
};
