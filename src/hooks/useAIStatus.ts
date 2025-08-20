import { useState, useEffect, useCallback } from "react";
import { ApiKeyManager } from "../services/ai/ApiKeyManager";
import { ProviderRegistry } from "../services/subscription/providers/ProviderRegistry";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "./useTranslation";
import { useFocusEffect } from "@react-navigation/native";

export interface AIStatus {
  isLoading: boolean;
  availableAPIs: string[];
  totalAPIs: number;
  isConfigured: boolean;
}

export const useAIStatus = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AIStatus>({
    isLoading: true,
    availableAPIs: [],
    totalAPIs: 0,
    isConfigured: false,
  });

  const checkAPIStatus = async () => {
    try {
      setStatus((prev) => ({ ...prev, isLoading: true }));

      const allProviders = ProviderRegistry.getAllProviders();
      const availableAPIs: string[] = [];

      for (const provider of allProviders) {
        const providerName = provider.name;
        const lowerCaseProviderName = providerName.toLowerCase();

        // Clé spéciale pour OpenAI
        const storageKey =
          lowerCaseProviderName === "openai"
            ? "use_custom_api"
            : `use_${lowerCaseProviderName}`;

        const isEnabledInSettings =
          (await AsyncStorage.getItem(storageKey)) === "true";
        const apiKey = await ApiKeyManager.getApiKey(lowerCaseProviderName);

        if (apiKey && isEnabledInSettings) {
          availableAPIs.push(providerName);
        }
      }

      const isAPIConfigured = availableAPIs.length > 0;
      if (__DEV__) {}

      setStatus({
        isLoading: false,
        availableAPIs,
        totalAPIs: availableAPIs.length,
        isConfigured: isAPIConfigured,
      });
    } catch (error) {
      setStatus({
        isLoading: false,
        availableAPIs: [],
        totalAPIs: 0,
        isConfigured: false,
      });
    }
  };

  // Vérifier le statut au montage
  useEffect(() => {
    checkAPIStatus();
  }, []);

  // Rafraîchir le statut quand l'écran reçoit le focus
  useFocusEffect(
    useCallback(() => {
      checkAPIStatus();
    }, [])
  );

  // Rafraîchir périodiquement uniquement tant que la config n'est pas prête
  useEffect(() => {
    if (status.isConfigured) return;
    const interval = setInterval(() => {
      checkAPIStatus();
    }, 60000);
    return () => clearInterval(interval);
  }, [status.isConfigured]);

  return {
    ...status,
    refresh: checkAPIStatus,
  };
};
