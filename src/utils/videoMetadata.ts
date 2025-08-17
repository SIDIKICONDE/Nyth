import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  codec?: string;
  bitrate?: number;
  quality: "480p" | "720p" | "1080p" | "4K";
}

/**
 * Détermine la qualité vidéo basée sur la résolution
 */
export function getQualityFromResolution(
  width: number,
  height: number
): VideoMetadata["quality"] {
  // 4K (3840x2160 ou 4096x2160)
  if (width >= 3840 || height >= 2160) {
    return "4K";
  }

  // 1080p (1920x1080)
  if (width >= 1920 || height >= 1080) {
    return "1080p";
  }

  // 720p (1280x720)
  if (width >= 1280 || height >= 720) {
    return "720p";
  }

  // 480p (854x480 ou 640x480)
  if (width >= 640 || height >= 480) {
    return "480p";
  }

  // Par défaut, retourner 720p si on ne peut pas déterminer
  return "720p";
}

/**
 * Compare deux qualités et retourne true si la qualité cible est supérieure à la source
 */
export function isUpscaling(
  sourceQuality: VideoMetadata["quality"],
  targetQuality: string
): boolean {
  const qualityOrder = {
    "480p": 1,
    "720p": 2,
    "1080p": 3,
    "4K": 4,
  };

  const sourceLevel = qualityOrder[sourceQuality] || 0;
  const targetLevel =
    qualityOrder[targetQuality as keyof typeof qualityOrder] || 0;

  return targetLevel > sourceLevel;
}

/**
 * Génère un message d'avertissement pour l'upscaling
 */
export function getUpscalingWarning(
  sourceQuality: string,
  targetQuality: string
): string {
  return `⚠️ Attention : Votre vidéo a été enregistrée en ${sourceQuality}. L'exporter en ${targetQuality} n'améliorera pas la qualité et augmentera inutilement la taille du fichier.\n\nQualité recommandée : ${sourceQuality} ou inférieure.`;
}

/**
 * Obtient les qualités d'export recommandées basées sur la qualité source
 */
export function getRecommendedExportQualities(
  sourceQuality: VideoMetadata["quality"]
): string[] {
  const allQualities = ["480p", "720p", "1080p", "4K"];
  const qualityOrder = {
    "480p": 1,
    "720p": 2,
    "1080p": 3,
    "4K": 4,
  };

  const sourceLevel = qualityOrder[sourceQuality] || 0;

  return allQualities.filter((q) => {
    const level = qualityOrder[q as keyof typeof qualityOrder] || 0;
    return level <= sourceLevel;
  });
}

/**
 * Simule l'extraction des métadonnées vidéo
 * Note: Dans une vraie application, on utiliserait une librairie native
 * pour extraire les vraies métadonnées du fichier vidéo
 */
export async function extractVideoMetadata(
  videoUri: string
): Promise<VideoMetadata | null> {
  try {
    // Vérifier que le fichier existe
    const fileInfo = await RNFS.stat(videoUri);
    if (!fileInfo.isFile()) {
      return null;
    }

    // TODO: Dans une vraie implémentation, utiliser une librairie native
    // pour extraire les métadonnées réelles (ffprobe, AVFoundation, MediaCodec)

    // Pour l'instant, essayer de récupérer la qualité depuis les paramètres d'enregistrement
    try {
      const savedSettings = await AsyncStorage.getItem("recordingSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings?.videoSettings?.quality) {
          const recordedQuality = settings.videoSettings.quality;

          // Convertir la qualité des paramètres en métadonnées
          let width = 1920,
            height = 1080,
            quality: VideoMetadata["quality"] = "1080p";

          if (
            recordedQuality.includes("2160") ||
            recordedQuality.includes("4K")
          ) {
            width = 3840;
            height = 2160;
            quality = "4K";
          } else if (recordedQuality.includes("1080")) {
            width = 1920;
            height = 1080;
            quality = "1080p";
          } else if (recordedQuality.includes("720")) {
            width = 1280;
            height = 720;
            quality = "720p";
          } else if (recordedQuality.includes("480")) {
            width = 854;
            height = 480;
            quality = "480p";
          }

          return {
            width,
            height,
            duration: 0,
            quality,
            codec: settings.videoSettings.codec || "h264",
            bitrate: 5000000,
          };
        }
      }
    } catch (err) {}

    return {
      width: 1920,
      height: 1080,
      duration: 0,
      quality: "1080p",
      codec: "h264",
      bitrate: 5000000,
    };
  } catch (error) {
    return null;
  }
}
