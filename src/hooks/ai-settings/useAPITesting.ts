import { useState } from "react";
import { Alert } from "react-native";
import { testApiKey } from "../../services/ai/ApiServices";
import { APISettings, APITestResult } from "./types";
import { useTranslation } from "../useTranslation";

export const useAPITesting = () => {
  const { t } = useTranslation();
  const [testingApi, setTestingApi] = useState("");

  // Test specific API
  const testAPI = async (
    apiName: string,
    settings: APISettings
  ): Promise<void> => {
    try {
      setTestingApi(apiName);

      let testResult = false;
      let errorMessage = "";

      let apiKey = "";
      switch (apiName) {
        case "openai":
          apiKey = settings.apiKey;
          break;
        case "gemini":
          apiKey = settings.geminiKey;
          break;
        case "mistral":
          apiKey = settings.mistralKey;
          break;
        case "cohere":
          apiKey = settings.cohereKey;
          break;
        case "claude":
          apiKey = settings.claudeKey;
          break;
        case "perplexity":
          apiKey = settings.perplexityKey;
          break;
        case "together":
          apiKey = settings.togetherKey;
          break;
        case "groq":
          apiKey = settings.groqKey;
          break;
        case "fireworks":
          apiKey = settings.fireworksKey;
          break;
        case "azureopenai":
          apiKey = settings.azureopenaiKey;
          break;
        case "openrouter":
          apiKey = settings.openrouterKey;
          break;
        case "deepinfra":
          apiKey = settings.deepinfraKey;
          break;
        case "xai":
          apiKey = settings.xaiKey;
          break;
        case "deepseek":
          apiKey = settings.deepseekKey;
          break;
        default:
          throw new Error(
            t("aiSettings.testing.error.unsupportedApi", { apiName })
          );
      }

      const result = await testApiKey(apiName, apiKey);
      testResult = result.success;
      errorMessage = result.message || "";

      if (testResult) {
        Alert.alert(
          t("aiSettings.testing.success.title"),
          t("aiSettings.testing.success.message", { apiName })
        );
      } else {
        Alert.alert(
          t("aiSettings.testing.failure.title"),
          errorMessage ||
            t("aiSettings.testing.failure.fallbackMessage", { apiName })
        );
      }
    } catch (error) {
      Alert.alert(
        t("aiSettings.testing.error.title"),
        t("aiSettings.testing.error.message")
      );
    } finally {
      setTestingApi("");
    }
  };

  // Test all enabled APIs
  const testAllAPIs = async (
    settings: APISettings
  ): Promise<APITestResult[]> => {
    const results: APITestResult[] = [];

    if (settings.useCustomAPI && settings.apiKey) {
      try {
        const result = await testApiKey("openai", settings.apiKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `OpenAI: ${error}` });
      }
    }

    if (settings.useGemini && settings.geminiKey) {
      try {
        const result = await testApiKey("gemini", settings.geminiKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Gemini: ${error}` });
      }
    }

    if (settings.useMistral && settings.mistralKey) {
      try {
        const result = await testApiKey("mistral", settings.mistralKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Mistral: ${error}` });
      }
    }

    if (settings.useCohere && settings.cohereKey) {
      try {
        const result = await testApiKey("cohere", settings.cohereKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Cohere: ${error}` });
      }
    }

    if (settings.useClaude && settings.claudeKey) {
      try {
        const result = await testApiKey("claude", settings.claudeKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Claude: ${error}` });
      }
    }

    if (settings.usePerplexity && settings.perplexityKey) {
      try {
        const result = await testApiKey("perplexity", settings.perplexityKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Perplexity: ${error}` });
      }
    }

    if (settings.useTogether && settings.togetherKey) {
      try {
        const result = await testApiKey("together", settings.togetherKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Together: ${error}` });
      }
    }

    if (settings.useGroq && settings.groqKey) {
      try {
        const result = await testApiKey("groq", settings.groqKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Groq: ${error}` });
      }
    }

    if (settings.useFireworks && settings.fireworksKey) {
      try {
        const result = await testApiKey("fireworks", settings.fireworksKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Fireworks: ${error}` });
      }
    }

    if (settings.useAzureOpenAI && settings.azureopenaiKey) {
      try {
        const result = await testApiKey("azureopenai", settings.azureopenaiKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `Azure OpenAI: ${error}` });
      }
    }

    if (settings.useOpenRouter && settings.openrouterKey) {
      try {
        const result = await testApiKey("openrouter", settings.openrouterKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `OpenRouter: ${error}` });
      }
    }

    if (settings.useDeepInfra && settings.deepinfraKey) {
      try {
        const result = await testApiKey("deepinfra", settings.deepinfraKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `DeepInfra: ${error}` });
      }
    }

    if (settings.useXAI && settings.xaiKey) {
      try {
        const result = await testApiKey("xai", settings.xaiKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `XAI: ${error}` });
      }
    }

    if (settings.useDeepSeek && settings.deepseekKey) {
      try {
        const result = await testApiKey("deepseek", settings.deepseekKey);
        results.push({ success: result.success, error: result.message });
      } catch (error) {
        results.push({ success: false, error: `DeepSeek: ${error}` });
      }
    }

    return results;
  };

  return {
    testingApi,
    testAPI,
    testAllAPIs,
  };
};
