import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useGlobalPreferences } from "../hooks/useGlobalPreferences";
import { DEFAULT_RECORDING_SETTINGS } from "../screens/SettingsScreen/utils/settingsDefaults";
import { RecordingSettings } from "../types";
import { VideoSettings } from "../types/video";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('SettingsContext');

interface SettingsContextType {
  settings: RecordingSettings;
  isSettingsLoaded: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  updateSetting: <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => void;
  updateVideoSettings: (newVideoSettings: VideoSettings) => void;
  saveSettingsToStorage: () => Promise<boolean>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const {
    recordingSettings: savedSettings,
    updateRecordingSettings,
    isLoading,
    isSyncing,
  } = useGlobalPreferences();

  const [settings, setSettings] = useState<RecordingSettings>(
    DEFAULT_RECORDING_SETTINGS
  );
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Charger les paramètres une seule fois
  useEffect(() => {
    if (!isLoading && !hasInitialized) {
      if (savedSettings) {
        // Fonction pour nettoyer les valeurs null/undefined
        const cleanValue = (value: any, defaultValue: any) => {
          if (value === null || value === undefined) {
            return defaultValue;
          }
          if (typeof value === "boolean") {
            return Boolean(value);
          }
          return value;
        };

        const mergedSettings: RecordingSettings = {
          ...DEFAULT_RECORDING_SETTINGS,
          ...savedSettings,
          isMirrored: cleanValue(
            savedSettings.isMirrored,
            DEFAULT_RECORDING_SETTINGS.isMirrored
          ),
          textShadow: cleanValue(
            savedSettings.textShadow,
            DEFAULT_RECORDING_SETTINGS.textShadow
          ),
          isMicEnabled: cleanValue(savedSettings.isMicEnabled, true),
          isVideoEnabled: cleanValue(savedSettings.isVideoEnabled, true),
          showCountdown: cleanValue(
            savedSettings.showCountdown,
            DEFAULT_RECORDING_SETTINGS.showCountdown
          ),
          audioEnabled: cleanValue(savedSettings.audioEnabled, true),
          videoEnabled: cleanValue(savedSettings.videoEnabled, true),
          videoQuality: (["480p", "720p", "1080p", "2160p"].includes(
            savedSettings.videoQuality as string
          )
            ? savedSettings.videoQuality
            : DEFAULT_RECORDING_SETTINGS.videoQuality) as
            | "480p"
            | "720p"
            | "1080p"
            | "2160p",
          videoSettings: {
            ...DEFAULT_RECORDING_SETTINGS.videoSettings,
            ...(savedSettings.videoSettings || {}),
            codec: cleanValue(
              savedSettings.videoSettings?.codec,
              DEFAULT_RECORDING_SETTINGS.videoSettings?.codec
            ),
            quality: cleanValue(
              savedSettings.videoSettings?.quality,
              DEFAULT_RECORDING_SETTINGS.videoSettings?.quality
            ),
            stabilization: cleanValue(
              savedSettings.videoSettings?.stabilization,
              DEFAULT_RECORDING_SETTINGS.videoSettings?.stabilization
            ),
          },
          quality:
            (savedSettings.quality as "low" | "medium" | "high") ||
            DEFAULT_RECORDING_SETTINGS.quality,
        };

        setSettings(mergedSettings);
      }
      setIsSettingsLoaded(true);
      setHasInitialized(true);
    }
  }, [isLoading, savedSettings, hasInitialized]);

  const updateSetting = <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => {
    logger.debug(`⚙️ SettingsContext - updateSetting: ${key} = ${value}`);
    if (key === "isMirrored") {
      logger.debug("🪞 SettingsContext - Mode miroir mis à jour:", value);
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Synchronisation Firebase en arrière-plan
    updateRecordingSettings(newSettings).catch((error) => {
      logger.error(`❌ Erreur synchronisation ${key}:`, error);
    });
  };

  const updateVideoSettings = (newVideoSettings: VideoSettings) => {
    const updatedSettings = {
      ...settings,
      videoSettings: newVideoSettings,
    };

    setSettings(updatedSettings);

    // Synchronisation Firebase en arrière-plan
    updateRecordingSettings(updatedSettings).catch((error) => {
      logger.error("❌ Erreur synchronisation vidéo:", error);
    });
  };

  const saveSettingsToStorage = async () => {
    try {
      await updateRecordingSettings(settings);
      return true;
    } catch (error) {
      logger.error("❌ Erreur synchronisation:", error);
      return false;
    }
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_RECORDING_SETTINGS);

    try {
      await updateRecordingSettings(DEFAULT_RECORDING_SETTINGS);
    } catch (error) {
      logger.error("❌ Erreur lors de la réinitialisation:", error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isSettingsLoaded,
        isLoading,
        isSyncing,
        updateSetting,
        updateVideoSettings,
        saveSettingsToStorage,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
