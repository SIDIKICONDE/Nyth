import { RecordingSettings } from "../../../types";
import {
  VideoCodec,
  VideoQuality,
  VideoStabilization,
} from "../../../types/video";

export const DEFAULT_RECORDING_SETTINGS: RecordingSettings = {
  // Propriétés requises de RecordingSettings
  audioEnabled: true,
  videoEnabled: true,
  quality: "high",
  countdown: 3,
  fontSize: 24,
  textColor: "#ffffff",
  horizontalMargin: 0,
  isCompactMode: false,
  // Propriétés optionnelles
  scrollCalculationMethod: "classic",
  scrollDurationMinutes: 3,
  scrollWPM: 180,
  scrollLinesPerSecond: 2,
  scrollUserLevel: "intermediaire",
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
  videoSettings: {
    codec: VideoCodec.H264,
    quality: VideoQuality["1080p"],
    stabilization: VideoStabilization.auto,
  },
};
