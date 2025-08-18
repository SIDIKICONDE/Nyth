export const LOADING_DELAY = 800;
export const EXPORT_STEPS = [
  "Analyse de la vidéo",
  "Optimisation audio",
  "Compression vidéo",
  "Finalisation",
  "Export terminé"
] as const;

export const DEFAULT_EXPORT_QUALITY = "1080p" as const;
export const DEFAULT_EXPORT_FORMAT = "mp4" as const;

export const VIDEO_QUALITY_COLORS = {
  "480p": "#3b82f6",
  "720p": "#10b981",
  "1080p": "#f59e0b",
  "4K": "#ef4444"
} as const;
