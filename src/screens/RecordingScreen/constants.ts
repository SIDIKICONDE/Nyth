import { RecordingSettings } from "@/types";
import { VideoCodec, VideoQuality, VideoStabilization } from "@/types/video";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";

export const DEFAULT_RECORDING_SETTINGS: RecordingSettings = {
  audioEnabled: true,
  videoEnabled: true,
  quality: "high",
  countdown: 3,
  fontSize: 24,
  textColor: "#ffffff",
  horizontalMargin: 0,
  isCompactMode: false,
  scrollSpeed: 50,
  isMirrored: false,
  isMicEnabled: true,
  isVideoEnabled: true,
  textAlignment: "center",
  textShadow: false,
  showCountdown: true,
  countdownDuration: 3,
  videoQuality: "720p",
  scrollAreaTop: 15,
  scrollAreaBottom: 20,
  scrollStartLevel: 5,
  videoSettings: {
    codec: VideoCodec.H264,
    quality: VideoQuality["720p"],
    stabilization: VideoStabilization.auto,
  },
};

export const DEFAULT_TELEPROMPTER_SETTINGS: Partial<TeleprompterSettings> = {
  fontSize: 24,
  textColor: "#FFFFFF",
  backgroundColor: "#000000",
  textAlignment: "center" as const,
  horizontalMargin: 10,
  isMirrored: false,
  textShadow: true,
  startPosition: "top" as const,
  positionOffset: 0,
  hideControls: false,
};

export const DEFAULT_SCROLL_SPEED = 50;
export const DEFAULT_BACKGROUND_OPACITY = 80;

export const RECORDING_TIMER_INTERVAL = 1000; // 1 seconde

export const ERROR_RECOVERY_CONFIG = {
  maxRetries: 3,
  autoRecovery: true,
};

export const STORAGE_KEYS = {
  recordingSettings: "recordingSettings",
};

export const PERMISSION_MESSAGES = {
  storageTitle: "Permission de stockage requise",
  storageMessage: "Pour sauvegarder vos vidéos, veuillez autoriser l'accès au stockage dans les paramètres.",
  storageAndroid13Title: "Permission d'accès aux vidéos",
  storageAndroid13Message: "Nyth a besoin d'accéder à vos vidéos pour sauvegarder les enregistrements.",
};

export const ALERT_MESSAGES = {
  exitWarning: {
    title: "Enregistrement en cours",
    message: "Voulez-vous vraiment arrêter l'enregistrement et quitter ?",
    stop: "Arrêter et quitter",
  },
  galleryError: {
    title: "Galerie non disponible",
    message: "La vidéo a été sauvegardée localement. Vous pourrez réessayer l'export vers la galerie depuis votre bibliothèque.",
    retry: "Réessayer",
  },
  saveError: {
    title: "Erreur",
    message: "L'enregistrement a été sauvegardé localement mais n'a pas pu être exporté dans la galerie.",
  },
  loadError: {
    title: "Erreur de chargement",
  },
  recordingError: {
    title: "Erreur d'enregistrement",
  },
};