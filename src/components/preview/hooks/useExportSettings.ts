import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "../../../hooks/useTranslation";
import {
  VideoMetadata,
  extractVideoMetadata,
  getUpscalingWarning,
  isUpscaling,
} from "../../../utils/videoMetadata";
import {
  DEFAULT_EXPORT_FORMAT,
  DEFAULT_EXPORT_QUALITY,
} from "../constants/defaultValues";
import {
  ExportFormat,
  ExportQuality,
  ExportSettings,
} from "../types/preview.types";
import { getRecordingSettings } from "../utils/storageUtils";

export const useExportSettings = (videoUri: string | undefined) => {
  const { t } = useTranslation();
  const [exportQuality, setExportQuality] = useState<ExportQuality>(
    DEFAULT_EXPORT_QUALITY
  );
  const [exportFormat, setExportFormat] = useState<ExportFormat>(
    DEFAULT_EXPORT_FORMAT
  );
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(
    null
  );
  const [sourceQuality, setSourceQuality] = useState<
    VideoMetadata["quality"] | "unknown"
  >("unknown");

  const handleFormatChange = useCallback(
    (newFormat: ExportFormat) => {
      setExportFormat(newFormat);
    },
    [exportFormat]
  );

  const handleQualityChange = useCallback(
    (newQuality: ExportQuality) => {
      if (videoMetadata && isUpscaling(videoMetadata.quality, newQuality)) {
        Alert.alert(
          t("exportOptions.quality.upscalingWarning.title"),
          getUpscalingWarning(videoMetadata.quality, newQuality),
          [
            {
              text: t("exportOptions.quality.upscalingWarning.cancel"),
              style: "cancel",
            },
            {
              text: t("exportOptions.quality.upscalingWarning.continue"),
              onPress: () => setExportQuality(newQuality),
            },
          ]
        );
      } else {
        setExportQuality(newQuality);
      }
    },
    [exportQuality, videoMetadata, t]
  );

  const syncWithVideoSettings = async () => {
    try {
      const settings = await getRecordingSettings(t);
      if (settings?.videoSettings) {
        let syncedQuality: ExportQuality = DEFAULT_EXPORT_QUALITY;
        let syncedFormat: ExportFormat = DEFAULT_EXPORT_FORMAT;

        const videoQuality = String(settings.videoSettings.quality || "");

        if (videoQuality.includes("2160") || videoQuality.includes("4K")) {
          syncedQuality = "4K";
        } else if (videoQuality.includes("1080")) {
          syncedQuality = "1080p";
        } else if (videoQuality.includes("720")) {
          syncedQuality = "720p";
        } else if (videoQuality.includes("480")) {
          syncedQuality = "480p";
        }

        const videoCodec = String(settings.videoSettings.codec || "");
        if (
          videoCodec.includes("HEVC") ||
          videoCodec.includes("ProRes") ||
          videoCodec.includes("MOV")
        ) {
          syncedFormat = "mov";
        } else {
          syncedFormat = "mp4";
        }

        if (exportQuality !== syncedQuality) {
          setExportQuality(syncedQuality);
        }

        if (exportFormat !== syncedFormat) {
          setExportFormat(syncedFormat);
        }

        setIsAutoDetected(false);
      } else {
        setExportQuality(DEFAULT_EXPORT_QUALITY);
        setExportFormat(DEFAULT_EXPORT_FORMAT);
        setIsAutoDetected(false);
      }
    } catch (error) {
      // Utiliser les paramètres par défaut en cas d'erreur
      setExportQuality(DEFAULT_EXPORT_QUALITY);
      setExportFormat(DEFAULT_EXPORT_FORMAT);
      setIsAutoDetected(false);
    }
  };

  const loadVideoMetadata = async () => {
    if (!videoUri) return;

    const metadata = await extractVideoMetadata(videoUri);
    if (metadata) {
      setVideoMetadata(metadata);
      setSourceQuality(metadata.quality);

      if (isUpscaling(metadata.quality, exportQuality)) {
        const validQuality = metadata.quality as ExportQuality;
        setExportQuality(validQuality);

        setTimeout(() => {
          Alert.alert(
            t("exportOptions.quality.qualityDetected.title"),
            t("exportOptions.quality.qualityDetected.message", {
              quality: metadata.quality,
            }),
            [{ text: t("exportOptions.quality.qualityDetected.understood") }]
          );
        }, 1000);
      }
    }
  };

  const exportSettings: ExportSettings = {
    exportQuality,
    exportFormat,
    isAutoDetected,
    videoMetadata,
    sourceQuality,
  };

  return {
    ...exportSettings,
    setExportQuality: handleQualityChange,
    setExportFormat: handleFormatChange,
    syncWithVideoSettings,
    loadVideoMetadata,
  };
};
