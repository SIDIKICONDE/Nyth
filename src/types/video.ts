export enum VideoCodec {
  H264 = "avc1",
  HEVC = "hvc1",
  // Codecs ProRes pour iOS (iPhone XS+)
  PRORES_422 = "ap4h",
  PRORES_422_HQ = "ap4x",
  PRORES_422_LT = "apcn",
  PRORES_422_PROXY = "apco",
  PRORES_4444 = "ap4c",
}

export enum VideoQuality {
  "480p" = "480p",
  "720p" = "720p",
  "1080p" = "1080p",
  "2160p" = "2160p", // 4K
  "square" = "square", // Format carré 1:1
}

export enum VideoStabilization {
  auto = "auto",
  standard = "standard",
  cinematic = "cinematic",
  off = "off",
}

export enum VideoFrameRate {
  FPS_24 = 24,
  FPS_30 = 30,
  FPS_60 = 60,
  FPS_120 = 120,
  FPS_240 = 240,
}

export enum VideoBitRate {
  EXTRA_LOW = "extra-low",
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  EXTRA_HIGH = "extra-high",
}

export interface VideoSettings {
  codec: VideoCodec;
  quality: VideoQuality;
  stabilization: VideoStabilization;
  frameRate?: VideoFrameRate;
  bitRate?: VideoBitRate | number; // Mbps personnalisé
  hdrEnabled?: boolean;
  lowLightBoost?: boolean;
  mirrorVideo?: boolean;
  flashMode?: "off" | "on" | "auto"; // Pour torche pendant enregistrement

  // Nouvelles fonctionnalités avancées
  segmentDuration?: number; // Durée des segments en secondes (0 = désactivé)
  enableProgressMonitoring?: boolean; // Monitoring progression temps réel
  customFrameRate?: number; // Frame rate personnalisé (24-240 fps)
  customBitRate?: number; // Bitrate personnalisé en bps
}

export interface CameraCapabilities {
  supportsVideoHDR: boolean;
  supportsLowLightBoost: boolean;
  maxZoom: number;
  minZoom: number;
  neutralZoom: number;
  supportedFrameRates: VideoFrameRate[];
  supportedCodecs: VideoCodec[];
  supportedQualities: VideoQuality[];
  hasTorch: boolean;
  physicalDevices: string[];
  maxVideoDuration: number; // en secondes
  supportedVideoStabilization: VideoStabilization[];
}

export interface AdvancedCameraSettings {
  // Zoom et exposition pour vidéo
  zoom: number;
  exposure: number;

  // Orientations
  outputOrientation: "preview" | "device";

  // Permissions et géolocalisation
  enableLocation: boolean;

  // Optimisations vidéo
  enableBufferCompression: boolean;
  enableFpsGraph: boolean;

  // Format des pixels pour Frame Processors
  pixelFormat: "yuv" | "rgb";

  // Mode torche pendant enregistrement
  torchMode: "off" | "on";

  // Qualité d'enregistrement
  videoQualityBalance: "speed" | "balanced" | "quality";

  // HDR vidéo
  hdrEnabled?: boolean;

  // Mode faible luminosité
  lowLightBoost?: boolean;

  // Codec vidéo sélectionné
  videoCodec?: VideoCodec;
}
