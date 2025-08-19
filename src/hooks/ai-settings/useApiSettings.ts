import { useState, useEffect, useCallback } from "react";
import { ApiKeyManager } from "../../services/ai/ApiKeyManager";
import { createLogger } from "../../utils/optimizedLogger";
import { useSettings } from "./useSettings";
import { APISettings } from "./types";

const logger = createLogger("useApiSettings");

/**
 * Hook pour gérer le chargement et la sauvegarde des paramètres API
 * Unifie la logique de stockage avec ApiKeyManager.
 */
export function useApiSettings() {
  const { settings, setSettings, resetSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge toutes les clés API et les préférences en utilisant ApiKeyManager.
   */
  const loadApiKeys = useCallback(async () => {
    logger.info("Chargement des paramètres API...");
    setIsLoading(true);
    setError(null);
    try {
      const [
        apiKey,
        geminiKey,
        mistralKey,
        cohereKey,
        claudeKey,
        perplexityKey,
        togetherKey,
        groqKey,
        fireworksKey,
        prefs,
      ] = await Promise.all([
        ApiKeyManager.getOpenAIKey(),
        ApiKeyManager.getGeminiKey(),
        ApiKeyManager.getMistralKey(),
        ApiKeyManager.getCohereKey(),
        ApiKeyManager.getClaudeKey(),
        ApiKeyManager.getPerplexityKey(),
        ApiKeyManager.getTogetherKey(),
        ApiKeyManager.getGroqKey(),
        ApiKeyManager.getFireworksKey(),
        ApiKeyManager.getApiPreference(),
      ]);

      // Récupérer les nouvelles clés (éviter await dans l'objet)
      const [
        azureopenaiKeyLoaded,
        openrouterKeyLoaded,
        deepinfraKeyLoaded,
        xaiKeyLoaded,
        deepseekKeyLoaded,
      ] = await Promise.all([
        ApiKeyManager.getApiKey("azureopenai"),
        ApiKeyManager.getApiKey("openrouter"),
        ApiKeyManager.getApiKey("deepinfra"),
        ApiKeyManager.getApiKey("xai"),
        ApiKeyManager.getApiKey("deepseek"),
      ]);

      setSettings((prev) => ({
        ...prev,
        apiKey: apiKey || "",
        useCustomAPI: prefs.useOpenAI,
        geminiKey: geminiKey || "",
        useGemini: prefs.useGemini,
        mistralKey: mistralKey || "",
        useMistral: prefs.useMistral,
        cohereKey: cohereKey || "",
        useCohere: prefs.useCohere,
        claudeKey: claudeKey || "",
        useClaude: prefs.useClaude,
        perplexityKey: perplexityKey || "",
        usePerplexity: prefs.usePerplexity,
        togetherKey: togetherKey || "",
        useTogether: prefs.useTogether,
        groqKey: groqKey || "",
        useGroq: prefs.useGroq,
        fireworksKey: fireworksKey || "",
        useFireworks: prefs.useFireworks,
        azureopenaiKey: azureopenaiKeyLoaded || "",
        useAzureOpenAI: (prefs as any).useAzureOpenAI || false,
        openrouterKey: openrouterKeyLoaded || "",
        useOpenRouter: (prefs as any).useOpenRouter || false,
        deepinfraKey: deepinfraKeyLoaded || "",
        useDeepInfra: (prefs as any).useDeepInfra || false,
        xaiKey: xaiKeyLoaded || "",
        useXAI: (prefs as any).useXAI || false,
        deepseekKey: deepseekKeyLoaded || "",
        useDeepSeek: (prefs as any).useDeepSeek || false,
      }));

      logger.info("✅ Paramètres API chargés avec succès");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logger.error("❌ Erreur lors du chargement des clés API:", errorMessage);
      setError("Erreur de chargement des clés API.");
    } finally {
      setIsLoading(false);
    }
  }, [setSettings]);

  /**
   * Sauvegarde toutes les clés API en utilisant ApiKeyManager.
   */
  const saveApiKeys = useCallback(
    async (newSettings: APISettings) => {
      logger.info("Sauvegarde des paramètres AI...");
      try {
        const promises: Promise<void>[] = [];
        
        // Pour chaque clé API, soit la sauvegarder, soit la supprimer
        // OpenAI
        if (newSettings.apiKey && newSettings.apiKey.trim() !== "") {
          promises.push(ApiKeyManager.setOpenAIKey(newSettings.apiKey));
        } else {
          // Supprimer la clé seulement lors de la sauvegarde explicite
          promises.push(ApiKeyManager.deleteOpenAIKey());
        }
        
        // Gemini
        if (newSettings.geminiKey && newSettings.geminiKey.trim() !== "") {
          promises.push(ApiKeyManager.setGeminiKey(newSettings.geminiKey));
        } else {
          promises.push(ApiKeyManager.deleteGeminiKey());
        }
        
        // Mistral
        if (newSettings.mistralKey && newSettings.mistralKey.trim() !== "") {
          promises.push(ApiKeyManager.setMistralKey(newSettings.mistralKey));
        } else {
          promises.push(ApiKeyManager.deleteMistralKey());
        }
        
        // Cohere
        if (newSettings.cohereKey && newSettings.cohereKey.trim() !== "") {
          promises.push(ApiKeyManager.setCohereKey(newSettings.cohereKey));
        } else {
          promises.push(ApiKeyManager.deleteCohereKey());
        }
        
        // Claude
        if (newSettings.claudeKey && newSettings.claudeKey.trim() !== "") {
          promises.push(ApiKeyManager.setClaudeKey(newSettings.claudeKey));
        } else {
          promises.push(ApiKeyManager.deleteClaudeKey());
        }
        
        // Perplexity
        if (
          newSettings.perplexityKey &&
          newSettings.perplexityKey.trim() !== ""
        ) {
          promises.push(
            ApiKeyManager.setPerplexityKey(newSettings.perplexityKey)
          );
        } else {
          promises.push(ApiKeyManager.deletePerplexityKey());
        }
        
        // Together
        if (newSettings.togetherKey && newSettings.togetherKey.trim() !== "") {
          promises.push(ApiKeyManager.setTogetherKey(newSettings.togetherKey));
        } else {
          promises.push(ApiKeyManager.deleteTogetherKey());
        }
        
        // Groq
        if (newSettings.groqKey && newSettings.groqKey.trim() !== "") {
          promises.push(ApiKeyManager.setGroqKey(newSettings.groqKey));
        } else {
          promises.push(ApiKeyManager.deleteGroqKey());
        }
        
        // Fireworks
        if (
          newSettings.fireworksKey &&
          newSettings.fireworksKey.trim() !== ""
        ) {
          promises.push(
            ApiKeyManager.setFireworksKey(newSettings.fireworksKey)
          );
        } else {
          promises.push(ApiKeyManager.deleteFireworksKey());
        }

        // Sauvegarder les clés pour les nouveaux providers (via SecureApiKeyManager)
        const { SecureApiKeyManager } = await import(
          "../../services/ai/SecureApiKeyManager"
        );
        if (
          newSettings.azureopenaiKey &&
          newSettings.azureopenaiKey.trim() !== ""
        ) {
          await SecureApiKeyManager.saveApiKey(
            "azureopenai",
            newSettings.azureopenaiKey
          );
        }
        if (
          newSettings.openrouterKey &&
          newSettings.openrouterKey.trim() !== ""
        ) {
          await SecureApiKeyManager.saveApiKey(
            "openrouter",
            newSettings.openrouterKey
          );
        }
        if (
          newSettings.deepinfraKey &&
          newSettings.deepinfraKey.trim() !== ""
        ) {
          await SecureApiKeyManager.saveApiKey(
            "deepinfra",
            newSettings.deepinfraKey
          );
        }
        if (newSettings.xaiKey && newSettings.xaiKey.trim() !== "") {
          await SecureApiKeyManager.saveApiKey("xai", newSettings.xaiKey);
        }
        if (newSettings.deepseekKey && newSettings.deepseekKey.trim() !== "") {
          await SecureApiKeyManager.saveApiKey(
            "deepseek",
            newSettings.deepseekKey
          );
        }

        promises.push(
          ApiKeyManager.setApiPreference({
            useOpenAI: newSettings.useCustomAPI,
            useGemini: newSettings.useGemini,
            useMistral: newSettings.useMistral,
            useCohere: newSettings.useCohere,
            useClaude: newSettings.useClaude,
            usePerplexity: newSettings.usePerplexity,
            useTogether: newSettings.useTogether,
            useGroq: newSettings.useGroq,
            useFireworks: newSettings.useFireworks,
            useAzureOpenAI: newSettings.useAzureOpenAI || false,
            useOpenRouter: newSettings.useOpenRouter || false,
            useDeepInfra: newSettings.useDeepInfra || false,
            useXAI: newSettings.useXAI || false,
            useDeepSeek: newSettings.useDeepSeek || false,
          } as any)
        );

        await Promise.all(promises);
        setSettings(newSettings); // Met à jour l'état local après sauvegarde
        logger.info("✅ Paramètres AI sauvegardés avec succès !");
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.error(
          "❌ Erreur lors de la sauvegarde des clés API:",
          errorMessage
        );
        setError("Erreur de sauvegarde des clés API.");
        throw e;
      }
    },
    [setSettings]
  );

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  return {
    settings,
    isLoading,
    error,
    loadApiKeys,
    saveApiKeys,
    resetSettings,
  };
}
