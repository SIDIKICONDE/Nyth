import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useRef } from "react";
import { VideoCodec } from "../../../types/video";
import { ExportFormat, ExportQuality } from "../types";
import { convertVideoQualityToExportQuality } from "../utils/qualityConverter";

interface UseVideoSettingsSyncProps {
  exportQuality: ExportQuality;
  exportFormat: ExportFormat;
  setExportQuality: (quality: ExportQuality) => void;
  setExportFormat: (format: ExportFormat) => void;
  setWarningMessage?: (message: string | null) => void;
  deviceName?: string;
  // ProRes n'est plus supporté
}

export const useVideoSettingsSync = ({
  exportQuality,
  exportFormat,
  setExportQuality,
  setExportFormat,
  setWarningMessage,
  deviceName,
}: UseVideoSettingsSyncProps) => {
  // Utiliser un ref pour suivre si la synchronisation initiale a été effectuée
  const hasSyncedRef = useRef(false);

  const syncWithVideoSettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("recordingSettings");
      if (!savedSettings) return;

      const settings = JSON.parse(savedSettings);
      if (!settings?.videoSettings) return;

      // Convertir la qualité vidéo en format d'export
      const syncedQuality = convertVideoQualityToExportQuality(
        settings.videoSettings.quality
      );

      // Convertir le codec en format
      let syncedFormat: ExportFormat = "mp4";
      if (
        settings.videoSettings.codec === VideoCodec.HEVC ||
        settings.videoSettings.codec === "HEVC"
      ) {
        syncedFormat = "mov";
        setWarningMessage?.(null);
      } else {
        syncedFormat = "mp4";
        setWarningMessage?.(null);
      }

      // Log uniquement lors de la première synchronisation
      if (!hasSyncedRef.current) {}

      // Mettre à jour les options d'export
      setExportQuality(syncedQuality);
      setExportFormat(syncedFormat);

      // Marquer la synchronisation comme effectuée
      hasSyncedRef.current = true;
    } catch (error) {}
  }, [setExportQuality, setExportFormat, setWarningMessage, deviceName]);

  return { syncWithVideoSettings };
};
