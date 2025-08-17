import type {
  CameraDevice,
  CameraPosition,
  VideoFile,
  PhotoFile,
} from "react-native-vision-camera";

export interface CameraConfig {
  position: CameraPosition;
  enableVideo: boolean;
  enableAudio: boolean;
  enableHighQualityPhotos: boolean;
  enablePortraitEffectsMatteDelivery?: boolean;
  enableDepthData?: boolean;
  enableStabilization?: boolean;
  qualityPrioritization?: "speed" | "balanced" | "quality";

  // Options avancées
  format?: any;
  zoom?: number;
  exposure?: number;
  enableHDR?: boolean;
  enableLowLightBoost?: boolean;
  videoStabilizationMode?:
    | "off"
    | "standard"
    | "cinematic"
    | "cinematic-extended"
    | "auto";
  outputOrientation?: "preview" | "device";
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  videoFile?: VideoFile;
}

export interface TeleprompterCameraProps {
  onRecordingComplete?: (video: VideoFile) => void;
  onError?: (error: Error) => void;
  teleprompterText?: string;
  scrollSpeed?: number;
  fontSize?: number;
  mirrorText?: boolean;
}

export interface CameraPermissions {
  camera: boolean;
  microphone: boolean;
}

export interface CameraControls {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  switchCamera: () => void;
  toggleFlash: () => void;
}

export interface TeleprompterSettings {
  scrollSpeed: number;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  opacity: number;
  mirrorText: boolean;
  autoScroll: boolean;
  margin: number;
}
