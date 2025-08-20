import { ProviderRegistry } from "../subscription/providers/ProviderRegistry";

export const testApiKey = async (
  providerName: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> => {
  const provider = ProviderRegistry.getProvider(providerName);

  if (!provider) {
    return {
      success: false,
      message: `Fournisseur ${providerName} non trouvé.`,
    };
  }

  return provider.testConnection(apiKey);
};
