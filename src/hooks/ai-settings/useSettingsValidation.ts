import { Alert } from "react-native";
import { APISettings } from "./types";
import { useTranslation } from "../useTranslation";

export const useSettingsValidation = () => {
  const { t } = useTranslation();

  // Validate all settings before saving
  const validateSettings = (settings: APISettings): boolean => {
    let hasError = false;

    if (settings.useCustomAPI && !settings.apiKey.trim()) {
      Alert.alert(
        t("aiSettings.error.title"),
        t("aiSettings.error.missingKey")
      );
      hasError = true;
    }

    if (settings.useGemini && !settings.geminiKey.trim()) {
      Alert.alert(
        t("aiSettings.error.title"),
        t("aiSettings.error.missingGeminiKey")
      );
      hasError = true;
    }

    if (settings.useMistral && !settings.mistralKey.trim()) {
      Alert.alert(
        t("aiSettings.error.title"),
        t("aiSettings.error.missingMistralKey")
      );
      hasError = true;
    }

    if (settings.useCohere && !settings.cohereKey.trim()) {
      Alert.alert(
        t("aiSettings.error.title"),
        t("aiSettings.error.missingCohereKey")
      );
      hasError = true;
    }

    return !hasError;
  };

  // Validate API key format
  const validateAPIKey = (key: string, provider: string): boolean => {
    if (!key || key.trim().length === 0) {
      return false;
    }

    // Basic validation based on provider
    switch (provider) {
      case "openai":
        return key.startsWith("sk-") && key.length > 20;
      case "gemini":
        return key.length > 10; // Gemini keys are variable length
      case "mistral":
        return key.length > 10;
      case "cohere":
        return key.length > 10;
      case "huggingface":
        return key.startsWith("hf_") && key.length > 20;
      default:
        return key.length > 5;
    }
  };

  // Get validation message for API key
  const getValidationMessage = (provider: string): string => {
    switch (provider) {
      case "openai":
        return t("aiSettings.validation.openai");
      case "gemini":
        return t("aiSettings.validation.gemini");
      case "mistral":
        return t("aiSettings.validation.mistral");
      case "cohere":
        return t("aiSettings.validation.cohere");
      case "huggingface":
        return t("aiSettings.validation.huggingface");
      default:
        return t("aiSettings.validation.default");
    }
  };

  // Check if at least one API is enabled
  const hasEnabledAPI = (settings: APISettings): boolean => {
    return (
      settings.useCustomAPI ||
      settings.useGemini ||
      settings.useMistral ||
      settings.useCohere
    );
  };

  return {
    validateSettings,
    validateAPIKey,
    getValidationMessage,
    hasEnabledAPI,
  };
};
