import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useScripts } from "@/contexts/ScriptsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalPreferences } from "@/hooks/useGlobalPreferences";
import { Script, RecordingSettings } from "@/types";
import { createLogger } from "@/utils/optimizedLogger";
import { DEFAULT_RECORDING_SETTINGS, STORAGE_KEYS, ALERT_MESSAGES } from "../constants";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";

const logger = createLogger("useRecordingData");

interface UseRecordingDataProps {
  scriptId: string;
  routeSettings?: RecordingSettings;
  onError: (error: Error) => void;
  onDataLoaded: (script: Script, settings: RecordingSettings) => void;
  onTeleprompterSettingsLoaded?: (settings: Partial<TeleprompterSettings>) => void;
}

export function useRecordingData({
  scriptId,
  routeSettings,
  onError,
  onDataLoaded,
  onTeleprompterSettingsLoaded,
}: UseRecordingDataProps) {
  const { scripts } = useScripts();
  const { t } = useTranslation();
  const { preferences: globalPreferences } = useGlobalPreferences();
  
  // Stabiliser les callbacks fournis par le parent pour éviter les recréations
  const onDataLoadedRef = useRef(onDataLoaded);
  const onErrorRef = useRef(onError);
  const onTeleprompterSettingsLoadedRef = useRef(onTeleprompterSettingsLoaded);
  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
  }, [onDataLoaded]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onTeleprompterSettingsLoadedRef.current = onTeleprompterSettingsLoaded;
  }, [onTeleprompterSettingsLoaded]);
  
  // Use ref to avoid re-renders when routeSettings changes
  const routeSettingsRef = useRef(routeSettings);
  useEffect(() => {
    routeSettingsRef.current = routeSettings;
  }, [routeSettings]);

  const loadScript = useCallback(() => {
    const foundScript = scripts.find((s) => s.id === scriptId);
    if (!foundScript) {
      throw new Error("Script non trouvé");
    }
    return foundScript;
  }, [scripts, scriptId]);

  const loadSettings = useCallback(async () => {
    let recordingSettings = routeSettingsRef.current;
    
    // Try to load from AsyncStorage if not provided
    if (!recordingSettings) {
      try {
        const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.recordingSettings);
        if (savedSettings) {
          recordingSettings = JSON.parse(savedSettings);
        }
      } catch (storageError) {
        logger.warn("Unable to load saved settings", storageError);
      }
    }

    // Use default settings if none found
    if (!recordingSettings) {
      recordingSettings = DEFAULT_RECORDING_SETTINGS;
    }

    return recordingSettings;
  }, []);

  const loadData = useCallback(async () => {
    try {
      logger.info("Loading recording data", { scriptId });

      // Load script
      const script = loadScript();

      // Load settings
      const settings = await loadSettings();

      logger.info("Data loaded successfully", {
        scriptTitle: script.title,
        settingsKeys: Object.keys(settings),
      });

      onDataLoadedRef.current?.(script, settings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      logger.error("Error loading data", error);
      onErrorRef.current?.(error);

      // Show alert only if it's not a recoverable error
      if (!error.message.includes("permission") && !error.message.includes("camera")) {
        Alert.alert(
          t("recording.error.loadError", ALERT_MESSAGES.loadError.title),
          error.message,
          [{ text: "OK" }]
        );
      }
    }
  }, [scriptId, loadScript, loadSettings, t]);

  // Load teleprompter settings from global preferences
  useEffect(() => {
    if (globalPreferences?.teleprompterSettings) {
      const saved = globalPreferences.teleprompterSettings as Partial<TeleprompterSettings>;
      if (saved && Object.keys(saved).length > 0) {
        onTeleprompterSettingsLoadedRef.current?.(saved);
      }
    }
  }, [globalPreferences?.teleprompterSettings]);

  // Update script when scripts context changes
  const updateScript = useCallback(() => {
    if (!scriptId) return;
    
    try {
      const updatedScript = scripts.find((s) => s.id === scriptId);
      if (updatedScript) {
        onDataLoadedRef.current?.(updatedScript, routeSettingsRef.current || DEFAULT_RECORDING_SETTINGS);
      }
    } catch (error) {
      logger.error("Error updating script", error);
    }
  }, [scriptId, scripts]);

  return {
    loadData,
    updateScript,
  };
}