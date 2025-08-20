import { ApiKeyManager } from "../services/ai/ApiKeyManager";
import { ProviderRegistry } from "../services/subscription/providers/ProviderRegistry";

export const checkHasAnyApiKey = async (): Promise<boolean> => {
  try {
    const providers = ProviderRegistry.getAllProviders();
    const logData: Record<string, boolean> = {};

    for (const provider of providers) {
      const key = await ApiKeyManager.getApiKey(provider.name.toLowerCase());
      logData[provider.name] = !!key;
      if (key) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
};

// Version synchrone pour vérifier les clés depuis les settings actuels
export const checkHasAnyApiKeyFromSettings = (
  settings: Record<string, string | undefined>
): boolean => {
  const providers = ProviderRegistry.getAllProviders();
  const logData: Record<string, boolean> = {};
  let hasAnyKey = false;

  for (const provider of providers) {
    // Les noms de clé dans l'objet settings peuvent varier (ex: apiKey pour openai)
    const settingsKey =
      provider.name === "openai" ? "apiKey" : `${provider.name}Key`;
    const keyExists = !!settings[settingsKey];
    logData[provider.name] = keyExists;
    if (keyExists) {
      hasAnyKey = true;
    }
  }

  return hasAnyKey;
};
