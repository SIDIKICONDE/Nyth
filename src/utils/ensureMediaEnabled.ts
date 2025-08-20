import { RecordingSettings } from "../types";
import { VideoCodec, VideoQuality, VideoStabilization } from "../types/video";

/**
 * S'assure que les paramètres média (micro et caméra) sont activés
 * @param settings Les paramètres d'enregistrement
 * @returns Les paramètres avec micro et caméra forcés à true
 */
export const ensureMediaEnabled = (
  settings: Partial<RecordingSettings>
): RecordingSettings => {
  // Paramètres vidéo par défaut
  const defaultVideoSettings = {
    codec: VideoCodec.H264,
    quality: VideoQuality["1080p"],
    stabilization: VideoStabilization.auto,
  };

  // Paramètres par défaut complets
  const defaultSettings: RecordingSettings = {
    // Propriétés requises
    audioEnabled: true,
    videoEnabled: true,
    quality: "high",
    countdown: 3,
    fontSize: 24,
    textColor: "#ffffff",
    horizontalMargin: 0,
    isCompactMode: false,
    // Propriétés optionnelles
    scrollSpeed: 50,
    isMirrored: false,
    isMicEnabled: true,
    isVideoEnabled: true,
    textAlignment: "center",
    textShadow: false,
    showCountdown: true,
    countdownDuration: 3,
    videoQuality: "1080p",
    scrollAreaTop: 15,
    scrollAreaBottom: 20,
    scrollStartLevel: 5,
    videoSettings: defaultVideoSettings,
  };

  // Fusionner avec les paramètres fournis
  const mergedSettings = {
    ...defaultSettings,
    ...settings,
    // Forcer l'activation du micro et de la caméra
    isMicEnabled: true,
    isVideoEnabled: true,
    audioEnabled: true,
    videoEnabled: true,
    // S'assurer que videoSettings existe avec toutes les propriétés requises
    videoSettings: {
      codec: settings.videoSettings?.codec || defaultVideoSettings.codec,
      quality: settings.videoSettings?.quality || defaultVideoSettings.quality,
      stabilization:
        settings.videoSettings?.stabilization ||
        defaultVideoSettings.stabilization,
    },
  };

  return mergedSettings;
};
