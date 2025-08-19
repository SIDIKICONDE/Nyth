import { useState, useEffect } from "react";
import { Alert } from "react-native";
import {
  AI_PROVIDERS,
} from "../config/aiConfig";
import { useTranslation } from "./useTranslation";
import {
  APISettings,
  UseAISettingsReturn,
  useApiSettings,
  useAPITesting,
  useCacheManagement,
  useSettingsValidation,
} from "./ai-settings";

export const useAISettings = (): UseAISettingsReturn => {
  const { t } = useTranslation();

  // Use modular hooks
  const {
    settings: apiSettings,
    loadApiKeys,
    saveApiKeys,
    isLoading: isLoadingSettings,
  } = useApiSettings();

  const [settings, setSettings] = useState<APISettings>(apiSettings);

  useEffect(() => {
    setSettings(apiSettings);
  }, [apiSettings]);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);

  const apiTesting = useAPITesting();
  const cacheManagement = useCacheManagement();
  const validation = useSettingsValidation();

  // Update a specific setting
  function updateSetting<K extends keyof APISettings>(
    key: K,
    value: APISettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  // Save all settings to AsyncStorage
  const saveSettings = async (): Promise<void> => {
    try {
      setIsSaving(true);

      // Validate settings first
      if (!validation.validateSettings(settings)) {
        return;
      }

      // Save settings
      await saveApiKeys(settings);

      Alert.alert(
        t("aiSettings.saveSuccess"),
        t("aiSettings.saveSuccessMessage")
      );
    } catch (error) {
      Alert.alert(t("common.error"), t("aiSettings.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle service toggle with cache cleanup
  const handleServiceToggle = async (
    service: string,
    isEnabled: boolean
  ): Promise<void> => {
    try {
      // Importer ApiKeyManager pour sauvegarder l'état d'activation
      const { ApiKeyManager } = await import("../services/ai/ApiKeyManager");
      const preferenceUpdate: { [key: string]: boolean } = {};

      // Mapper le service vers la préférence correspondante
      switch (service) {
        case AI_PROVIDERS.OPENAI:
          preferenceUpdate.useOpenAI = isEnabled;
          break;
        case AI_PROVIDERS.GEMINI:
          preferenceUpdate.useGemini = isEnabled;
          break;
        case AI_PROVIDERS.MISTRAL:
          preferenceUpdate.useMistral = isEnabled;
          break;
        case AI_PROVIDERS.COHERE:
          preferenceUpdate.useCohere = isEnabled;
          break;
        case AI_PROVIDERS.CLAUDE:
          preferenceUpdate.useClaude = isEnabled;
          break;
        case AI_PROVIDERS.PERPLEXITY:
          preferenceUpdate.usePerplexity = isEnabled;
          break;
        case AI_PROVIDERS.TOGETHER:
          preferenceUpdate.useTogether = isEnabled;
          break;
        case AI_PROVIDERS.GROQ:
          preferenceUpdate.useGroq = isEnabled;
          break;
        case AI_PROVIDERS.FIREWORKS:
          preferenceUpdate.useFireworks = isEnabled;
          break;
        default:
          return;
      }

      // Sauvegarder la préférence (synchronise automatiquement avec AsyncStorage)
      await ApiKeyManager.setApiPreference(preferenceUpdate);

      // Nettoyer le cache si le service est désactivé
      if (!isEnabled) {
        await cacheManagement.clearCacheForProvider(service);
      }
    } catch (error) {
      throw error;
    }
  };

  // Test API wrapper
  const testAPI = async (apiName: string): Promise<void> => {
    await apiTesting.testAPI(apiName, settings);
  };

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        loadApiKeys(),
        cacheManagement.refreshCacheStats(),
      ]);
    };

    initialize();
  }, []);

  return {
    // Settings state
    settings,
    updateSetting,

    // Loading states
    isLoading: isLoadingSettings,
    isSaving,
    testingApi: apiTesting.testingApi,
    clearingCache: cacheManagement.clearingCache,

    // Priority management
    priorityOrder: [], // Removed priorityOrder state
    setPriorityOrder: () => {}, // Removed setPriorityOrder function

    // Cache management
    cacheStats: cacheManagement.cacheStats,
    clearCache: cacheManagement.clearCache,
    refreshCacheStats: cacheManagement.refreshCacheStats,

    // API testing
    testAPI,

    // Settings management
    saveSettings,
    loadSettings: loadApiKeys,

    // Service management
    handleServiceToggle,
  };
};
