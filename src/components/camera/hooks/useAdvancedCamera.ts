import { useState, useCallback, useEffect } from "react";
import { useCameraDevice } from "react-native-vision-camera";
import type { CameraPosition } from "react-native-vision-camera";
import type {
  AdvancedCameraConfig,
  Resolution,
  Codec,
} from "../types/advanced";

interface CameraCapabilities {
  maxZoom: number;
  minZoom: number;
  supportsHDR: boolean;
  supportsLowLight: boolean;
  supportedResolutions: string[];
  supportedCodecs: string[];
  supportedFrameRates: number[];
  physicalDevices: string[];
  hasTorch: boolean;
}

export const useAdvancedCamera = (position: CameraPosition) => {
  const device = useCameraDevice(position);

  // Obtenir les résolutions supportées
  const getSupportedResolutions = useCallback((): Resolution[] => {
    const resolutions: Resolution[] = ["720p", "1080p"];

    if (device?.formats) {
      const has4K = device.formats.some(
        (format: any) =>
          format.videoWidth === 3840 && format.videoHeight === 2160
      );
      if (has4K) {
        resolutions.push("4K");
      }
    }

    return resolutions;
  }, [device]);

  // Obtenir les codecs supportés
  const getSupportedCodecs = useCallback((): Codec[] => {
    const codecs: Codec[] = ["h264"];

    // Vérifier si H.265 est supporté (iOS 11+, Android API 21+)
    if (device?.formats?.some((f: any) => f.supportsVideoHdr)) {
      codecs.push("h265");
    }

    return codecs;
  }, [device]);

  // Obtenir les fréquences d'images supportées
  const getSupportedFrameRates = useCallback((): number[] => {
    const frameRates = [24, 30];

    if (device?.formats) {
      const has60fps = device.formats.some(
        (format: any) => format.maxFps && format.maxFps >= 60
      );
      if (has60fps) {
        frameRates.push(60);
      }
    }

    return frameRates;
  }, [device]);

  // Calculer le débit vidéo selon la résolution et qualité
  const getVideoBitRate = useCallback(
    (resolution: string, quality: string): number => {
      const baseRates = {
        "720p": { speed: 2000000, balanced: 4000000, quality: 6000000 },
        "1080p": { speed: 4000000, balanced: 8000000, quality: 12000000 },
        "4K": { speed: 12000000, balanced: 20000000, quality: 35000000 },
      };

      return (
        baseRates[resolution as keyof typeof baseRates]?.[
          quality as keyof (typeof baseRates)["720p"]
        ] || 8000000
      );
    },
    []
  );

  // Calculer le débit audio selon la qualité
  const getAudioBitRate = useCallback((quality: string): number => {
    switch (quality) {
      case "standard":
        return 128000; // 128 kbps
      case "high":
        return 256000; // 256 kbps
      case "lossless":
        return 1411200; // 1411 kbps (équivalent CD)
      default:
        return 256000;
    }
  }, []);

  // Configuration par défaut
  const [config, setConfig] = useState<AdvancedCameraConfig>({
    resolution: "1080p",
    codec: "h264",
    qualityMode: "balanced",
    frameRate: 30,
    manualControls: false,
    zoom: 1,
    exposure: 0,
    iso: 100,
    stabilization: "standard",
    hdr: false,
    lowLightBoost: false,
    aspectRatio: "auto",
    orientation: "auto",
    audioQuality: "high",
    microphoneGain: 50,
    noiseReduction: true,
    teleprompterEnabled: true,
  });

  // Obtenir les capacités de l'appareil
  const getCapabilities = useCallback((): CameraCapabilities => {
    if (!device) {
      return {
        maxZoom: 1,
        minZoom: 1,
        supportsHDR: false,
        supportsLowLight: false,
        supportedResolutions: ["720p", "1080p"],
        supportedCodecs: ["h264"],
        supportedFrameRates: [30],
        physicalDevices: [],
        hasTorch: false,
      };
    }

    return {
      maxZoom: device.maxZoom || 10,
      minZoom: device.minZoom || 1,
      supportsHDR: device.formats?.some((f) => f.supportsVideoHdr) || false,
      supportsLowLight: device.supportsLowLightBoost || false,
      supportedResolutions: getSupportedResolutions(),
      supportedCodecs: getSupportedCodecs(),
      supportedFrameRates: getSupportedFrameRates(),
      physicalDevices: device.physicalDevices || [],
      hasTorch: device.hasTorch || false,
    };
  }, [
    device,
    getSupportedResolutions,
    getSupportedCodecs,
    getSupportedFrameRates,
  ]);

  // Convertir la configuration en props pour la caméra
  const getCameraProps = useCallback(() => {
    const format = device?.formats?.find((f) => {
      const isCorrectResolution = getResolutionMatch(f, config.resolution);
      const isCorrectFrameRate = f.maxFps && f.maxFps >= config.frameRate;
      return isCorrectResolution && isCorrectFrameRate;
    });

    return {
      format,
      zoom: config.manualControls ? config.zoom : 1,
      exposure: config.manualControls ? config.exposure : 0,
      enableHDR: config.hdr,
      enableLowLightBoost: config.lowLightBoost,
      videoStabilizationMode: getStabilizationMode(config.stabilization) as any,
      outputOrientation:
        config.orientation === "auto" ? "preview" : ("device" as any),
    };
  }, [device, config]);

  // Correspondance résolution/format
  const getResolutionMatch = (format: any, resolution: string): boolean => {
    switch (resolution) {
      case "720p":
        return format.videoWidth === 1280 && format.videoHeight === 720;
      case "1080p":
        return format.videoWidth === 1920 && format.videoHeight === 1080;
      case "4K":
        return format.videoWidth >= 3840 || format.videoHeight >= 2160;
      default:
        return true;
    }
  };

  // Mode de stabilisation
  const getStabilizationMode = (
    mode: string
  ): "off" | "standard" | "cinematic" | "cinematic-extended" | "auto" => {
    switch (mode) {
      case "off":
        return "off";
      case "standard":
        return "standard";
      case "cinematic":
        return "cinematic-extended";
      default:
        return "auto";
    }
  };

  // Obtenir les options d'enregistrement
  const getRecordingOptions = useCallback(() => {
    return {
      fileType: "mp4",
      videoCodec: config.codec === "h265" ? "h265" : "h264",
      videoBitRate: getVideoBitRate(config.resolution, config.qualityMode),
      audioBitRate: getAudioBitRate(config.audioQuality),
    };
  }, [
    config.codec,
    config.resolution,
    config.qualityMode,
    config.audioQuality,
    getVideoBitRate,
    getAudioBitRate,
  ]);

  // Valider la configuration
  const validateConfig = useCallback(
    (newConfig: AdvancedCameraConfig): boolean => {
      const capabilities = getCapabilities();

      // Vérifier le zoom
      if (
        newConfig.zoom > capabilities.maxZoom ||
        newConfig.zoom < capabilities.minZoom
      ) {
        return false;
      }

      // Vérifier HDR
      if (newConfig.hdr && !capabilities.supportsHDR) {
        return false;
      }

      // Vérifier mode faible luminosité
      if (newConfig.lowLightBoost && !capabilities.supportsLowLight) {
        return false;
      }

      return true;
    },
    [getCapabilities]
  );

  // Mettre à jour la configuration
  const updateConfig = useCallback(
    (updates: Partial<AdvancedCameraConfig>) => {
      const newConfig = { ...config, ...updates };

      if (validateConfig(newConfig)) {
        setConfig(newConfig);
      }
    },
    [config, validateConfig]
  );

  // Obtenir un preset de configuration
  const applyPreset = useCallback(
    (preset: "social" | "professional" | "streaming" | "mobile") => {
      const presets: Record<string, Partial<AdvancedCameraConfig>> = {
        social: {
          resolution: "1080p",
          codec: "h264",
          qualityMode: "balanced",
          frameRate: 30,
          stabilization: "standard",
          audioQuality: "high",
        },
        professional: {
          resolution: "4K",
          codec: "h265",
          qualityMode: "quality",
          frameRate: 24,
          stabilization: "cinematic",
          audioQuality: "lossless",
          hdr: true,
        },
        streaming: {
          resolution: "1080p",
          codec: "h264",
          qualityMode: "speed",
          frameRate: 60,
          stabilization: "standard",
          audioQuality: "high",
        },
        mobile: {
          resolution: "720p",
          codec: "h264",
          qualityMode: "speed",
          frameRate: 30,
          stabilization: "standard",
          audioQuality: "standard",
        },
      };

      const presetConfig = presets[preset];
      if (presetConfig) {
        updateConfig(presetConfig);
      }
    },
    [updateConfig]
  );

  // Calculer l'espace de stockage estimé
  const getEstimatedStorage = useCallback(
    (durationMinutes: number = 1): string => {
      const videoBitRate = getVideoBitRate(
        config.resolution,
        config.qualityMode
      );
      const audioBitRate = getAudioBitRate(config.audioQuality);
      const totalBitRate = videoBitRate + audioBitRate;

      // Calculer en MB par minute
      const mbPerMinute = (totalBitRate * 60) / (8 * 1024 * 1024);
      const totalMB = mbPerMinute * durationMinutes;

      if (totalMB > 1024) {
        return `${(totalMB / 1024).toFixed(1)} GB`;
      }
      return `${totalMB.toFixed(0)} MB`;
    },
    [config, getVideoBitRate, getAudioBitRate]
  );

  // Initialiser avec les capacités du device
  useEffect(() => {
    const capabilities = getCapabilities();

    // Ajuster la config si nécessaire
    if (config.zoom > capabilities.maxZoom) {
      updateConfig({ zoom: capabilities.maxZoom });
    }

    if (config.hdr && !capabilities.supportsHDR) {
      updateConfig({ hdr: false });
    }

    if (config.lowLightBoost && !capabilities.supportsLowLight) {
      updateConfig({ lowLightBoost: false });
    }
  }, [
    device,
    config.zoom,
    config.hdr,
    config.lowLightBoost,
    getCapabilities,
    updateConfig,
  ]);

  return {
    config,
    updateConfig,
    capabilities: getCapabilities(),
    cameraProps: getCameraProps(),
    recordingOptions: getRecordingOptions(),
    applyPreset,
    validateConfig,
    getEstimatedStorage,
  };
};
