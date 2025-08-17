import { DEFAULT_ASPECT_RATIO, QUALITY_TO_HEIGHT_MAP } from "../constants";
import { ExportQuality, VideoDimensions } from "../types";

export const calculateDimensions = (
  exportQuality: ExportQuality,
  aspectRatio?: { width: number; height: number }
): VideoDimensions => {
  // Hauteur de base selon la qualité
  const baseHeight = QUALITY_TO_HEIGHT_MAP[exportQuality];

  // Appliquer le ratio (par défaut 16:9)
  if (!aspectRatio) {
    return {
      width: Math.round(baseHeight * DEFAULT_ASPECT_RATIO),
      height: baseHeight,
    };
  }

  const ratio = aspectRatio.width / aspectRatio.height;
  return {
    width: Math.round(baseHeight * ratio),
    height: baseHeight,
  };
};
