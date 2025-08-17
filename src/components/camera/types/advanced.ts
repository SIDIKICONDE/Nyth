export type Resolution = "720p" | "1080p" | "4K";
export type Codec = "h264" | "h265";
export type QualityMode = "speed" | "balanced" | "quality";
export type FrameRate = 24 | 30 | 60;
export type StabilizationMode = "off" | "standard" | "cinematic";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";
export type Orientation = "auto" | "portrait" | "landscape";
export type AudioQuality = "standard" | "high" | "lossless";

export interface AdvancedCameraConfig {
  resolution: Resolution;
  codec: Codec;
  qualityMode: QualityMode;
  frameRate: FrameRate;
  manualControls: boolean;
  zoom: number;
  exposure: number;
  iso: number;
  stabilization: StabilizationMode;
  hdr: boolean;
  lowLightBoost: boolean;
  aspectRatio: AspectRatio;
  orientation: Orientation;
  audioQuality: AudioQuality;
  microphoneGain: number;
  noiseReduction: boolean;
  teleprompterEnabled: boolean;
}

export interface AdvancedCameraCapabilities {
  maxZoom: number;
  supportsHDR: boolean;
  supportsLowLight: boolean;
  supportedResolutions: Array<Resolution | string>;
  supportedCodecs: Array<Codec | string>;
}
