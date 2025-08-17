import { useState, useCallback } from "react";
import { APISettings } from "./types";

/**
 * Hook de base pour gérer l'état des paramètres API.
 * Ne contient aucune logique de stockage, juste la gestion de l'état.
 */
export function useSettings() {
  const [settings, setSettings] = useState<APISettings>({
    apiKey: "",
    useCustomAPI: true,
    geminiKey: "",
    useGemini: true,
    mistralKey: "",
    useMistral: true,
    cohereKey: "",
    useCohere: true,
    claudeKey: "",
    useClaude: true,
    perplexityKey: "",
    usePerplexity: true,
    togetherKey: "",
    useTogether: true,
    groqKey: "",
    useGroq: true,
    fireworksKey: "",
    useFireworks: true,
    // Nouveaux providers
    azureopenaiKey: "",
    useAzureOpenAI: false,
    openrouterKey: "",
    useOpenRouter: false,
    deepinfraKey: "",
    useDeepInfra: false,
    xaiKey: "",
    useXAI: false,
    deepseekKey: "",
    useDeepSeek: false,
    temperature: 0.7,
    maxTokens: 1024,
    model: "default",
  });

  const resetSettings = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      apiKey: "",
      geminiKey: "",
      mistralKey: "",
      cohereKey: "",
      claudeKey: "",
      perplexityKey: "",
      togetherKey: "",
      groqKey: "",
      fireworksKey: "",
      azureopenaiKey: "",
      openrouterKey: "",
      deepinfraKey: "",
      xaiKey: "",
      deepseekKey: "",
    }));
  }, []);

  return { settings, setSettings, resetSettings };
}
