import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEnabledProviders } from "../../config/aiConfig";
import i18next from "../../locales/i18n";
import { AIStatus } from "../../types/chat";
import { ApiKeyManager } from "../ai/ApiKeyManager";
import { ProviderRegistry } from "../subscription/providers/ProviderRegistry";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("AIConnectionService");

// Fonction pour générer un message d'accueil dynamique
export const generateWelcomeMessage = async (): Promise<string> => {
  const t = i18next.t.bind(i18next);

  const greetings = t("aiConnection.welcome.greetings", {
    returnObjects: true,
  }) as unknown as string[];
  const introductions = t("aiConnection.welcome.introductions", {
    returnObjects: true,
  }) as unknown as string[];
  const offerings = t("aiConnection.welcome.offerings", {
    returnObjects: true,
  }) as unknown as string[];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const introduction =
    introductions[Math.floor(Math.random() * introductions.length)];
  const offering = offerings[Math.floor(Math.random() * offerings.length)];

  return `${greeting}! ${introduction}. ${offering}`;
};

export const AIConnectionService = {
  /**
   * Vérifie la connexion à l'IA en utilisant le système de providers unifié
   */
  checkAiConnection: async (
    forceStatus?: boolean
  ): Promise<{
    status: AIStatus;
    initialMessage: string;
  }> => {
    const t = i18next.t.bind(i18next);

    try {
      const enabledProviders = await getEnabledProviders();
      logger.info(t("aiConnection.logs.providersAvailable"), enabledProviders);

      const hasAnyKey = (await ApiKeyManager.getAllKeysStatus()).some(
        (s) => s.status === "available"
      );

      let status: AIStatus = "unknown";
      let initialMessage = "";

      if (forceStatus && hasAnyKey) {
        logger.info(t("aiConnection.logs.forceStatusMode"));
        status = "connected";
        initialMessage = t("aiConnection.status.conversationLoaded");
      } else if (enabledProviders.length > 0) {
        logger.info(t("aiConnection.logs.mainApiDetected"));
        status = "connected";
        initialMessage = await generateWelcomeMessage();
      } else {
        logger.info(t("aiConnection.logs.noMainApiDetected"));
        status = "unknown";
        initialMessage = t("aiConnection.status.noApiConfigured");
      }

      return { status, initialMessage };
    } catch (error) {
      logger.error(t("aiConnection.logs.connectionCheckError"), error);
      return {
        status: "unknown",
        initialMessage: t("aiConnection.status.connectionError"),
      };
    }
  },

  /**
   * Teste la connexion pour n'importe quel fournisseur via le ProviderRegistry
   */
  testProviderConnection: async (providerName: string): Promise<boolean> => {
    const t = i18next.t.bind(i18next);
    logger.info(`Test de connexion direct pour ${providerName}...`);

    try {
      const provider = ProviderRegistry.getProvider(providerName);
      if (!provider) {
        logger.error(`Provider ${providerName} non trouvé dans le registre.`);
        return false;
      }

      const apiKey = await ApiKeyManager.getApiKey(providerName);
      if (!apiKey) {
        logger.warn(`Clé API non trouvée pour ${providerName}.`);
        return false;
      }

      const result = await provider.testConnection(apiKey);

      if (result.success) {
        logger.info(`✅ Connexion réussie pour ${providerName}.`);
      } else {
        logger.error(
          `❌ Échec de la connexion pour ${providerName}:`,
          result.message
        );
      }

      return result.success;
    } catch (error) {
      logger.error(
        `Exception lors du test de connexion pour ${providerName}`,
        error
      );
      return false;
    }
  },
};
