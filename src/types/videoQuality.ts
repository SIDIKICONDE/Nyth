/**
 * Type unifié pour les qualités vidéo utilisé dans toute l'application
 */
export type VideoQualityType = "480p" | "720p" | "1080p" | "4K";

/**
 * Mapping entre les différentes représentations de qualité
 */
export const QualityMapping = {
  // Export/Display -> Enum value
  "480p": "480p",
  "720p": "720p",
  "1080p": "1080p",
  "4K": "2160p", // 4K est affiché mais stocké comme 2160p
} as const;

/**
 * Convertit une qualité d'affichage en valeur enum
 */
export function toEnumQuality(displayQuality: VideoQualityType): string {
  return QualityMapping[displayQuality] || displayQuality;
}

/**
 * Convertit une valeur enum en qualité d'affichage
 */
export function toDisplayQuality(enumQuality: string): VideoQualityType {
  if (enumQuality === "2160p") return "4K";
  return enumQuality as VideoQualityType;
}
