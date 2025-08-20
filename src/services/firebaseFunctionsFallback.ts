import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("FirebaseFunctionsFallback");

type AsyncStorageWithAllKeys = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
};

const storage = AsyncStorage as unknown as AsyncStorageWithAllKeys;

interface FunctionCallResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  source: "firebase" | "fallback" | "cache";
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 seconde
  maxDelay: 10000, // 10 secondes
  backoffMultiplier: 2,
};

/**
 * Service de fallback pour Firebase Functions avec retry et cache
 * Spécialement conçu pour gérer les problèmes de connectivité en production IPA
 */
export class FirebaseFunctionsFallbackService {
  private static readonly CACHE_PREFIX = "@firebase_functions_cache_";
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

  /**
   * Appel sécurisé d'une Firebase Function avec fallback et retry
   */
  static async callFunction<T = unknown>(
    functionName: string,
    data: unknown = {},
    options: {
      retryConfig?: Partial<RetryConfig>;
      useCache?: boolean;
      cacheDuration?: number;
      fallbackValue?: T;
    } = {}
  ): Promise<FunctionCallResult<T>> {
    const {
      retryConfig = {},
      useCache = true,
      cacheDuration = this.CACHE_DURATION,
      fallbackValue,
    } = options;

    const finalRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    logger.info(`🔄 Appel Firebase Function: ${functionName}`, { data });

    // 1. Vérifier le cache d'abord si activé
    if (useCache) {
      const cachedResult = await this.getCachedResult<T>(
        functionName,
        data,
        cacheDuration
      );
      if (cachedResult) {
        logger.info(`✅ Résultat trouvé dans le cache: ${functionName}`);
        return {
          success: true,
          data: cachedResult,
          source: "cache",
        };
      }
    }

    // 2. Essayer l'appel Firebase Functions avec retry
    const firebaseResult = await this.callFirebaseFunctionWithRetry<T>(
      functionName,
      data,
      finalRetryConfig
    );

    if (firebaseResult.success) {
      // Mettre en cache le résultat si succès
      if (useCache && firebaseResult.data) {
        await this.cacheResult(functionName, data, firebaseResult.data);
      }
      return firebaseResult;
    }

    const silentFunctions = new Set(["getManagedAPIKey", "getOpenAIKey"]);
    if (silentFunctions.has(functionName)) {
      logger.info(
        `Firebase Functions échoué pour ${functionName}, tentative de fallback`
      );
    } else {
      logger.warn(
        `⚠️ Firebase Functions échoué pour ${functionName}, tentative de fallback`
      );
    }

    const fallbackResult = await this.tryFallbacks<T>(
      functionName,
      data,
      fallbackValue
    );

    if (fallbackResult.success) {
      return fallbackResult;
    }

    // 4. Dernière tentative : vérifier le cache même expiré
    if (useCache) {
      const expiredCachedResult = await this.getCachedResult<T>(
        functionName,
        data,
        Infinity // Accepter même les résultats expirés
      );
      if (expiredCachedResult) {
        logger.warn(
          `⚠️ Utilisation du cache expiré pour ${functionName} (pas d'autre option)`
        );
        return {
          success: true,
          data: expiredCachedResult,
          source: "cache",
        };
      }
    }

    // 5. Échec total
    return {
      success: false,
      error: `Impossible d'appeler ${functionName}: Firebase Functions indisponible et aucun fallback trouvé`,
      source: "firebase",
    };
  }

  /**
   * Appel Firebase Functions avec retry et backoff exponentiel
   */
  private static async callFirebaseFunctionWithRetry<T>(
    functionName: string,
    data: unknown,
    retryConfig: RetryConfig
  ): Promise<FunctionCallResult<T>> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        logger.info(
          `🔄 Tentative ${attempt + 1}/${
            retryConfig.maxRetries + 1
          } pour ${functionName}`
        );

        const firebaseConfig = (await import("../config/firebase")) as {
          initializeFirebase: () => Promise<boolean>;
          setupFirebaseServices: () => void;
          functions:
            | {
                httpsCallable<TData = unknown, TResult = unknown>(
                  name: string
                ): (input?: TData) => Promise<{ data: TResult }>;
              }
            | undefined;
        };
        await firebaseConfig.initializeFirebase();
        firebaseConfig.setupFirebaseServices();
        if (!firebaseConfig.functions) {
          throw new Error("Firebase functions unavailable");
        }
        const callable = firebaseConfig.functions.httpsCallable(functionName);

        // Timeout pour éviter les appels qui traînent
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 30000); // 30 secondes
        });

        const callPromise = callable(data);

        const result = (await Promise.race([callPromise, timeoutPromise])) as {
          data: T;
        };

        logger.info(`✅ Firebase Functions succès: ${functionName}`);
        return {
          success: true,
          data: (result as any).data,
          source: "firebase",
        };
      } catch (error: unknown) {
        lastError = error;
        logger.warn(
          `⚠️ Tentative ${attempt + 1} échouée pour ${functionName}:`,
          error
        );

        // Ne pas retry sur certaines erreurs
        if (this.isNonRetryableError(error)) {
          logger.warn(`❌ Erreur non-retryable, arrêt des tentatives`);
          break;
        }

        // Attendre avant le prochain retry (sauf pour la dernière tentative)
        if (attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.baseDelay *
              Math.pow(retryConfig.backoffMultiplier, attempt),
            retryConfig.maxDelay
          );
          logger.info(`⏳ Attente ${delay}ms avant retry`);
          await this.sleep(delay);
        }
      }
    }

    let message = "Erreur inconnue";
    if (lastError && typeof lastError === "object" && "message" in lastError) {
      const m = (lastError as { message?: unknown }).message;
      if (typeof m === "string" && m.length > 0) message = m;
    } else {
      try {
        message = String(lastError);
      } catch {}
    }
    return { success: false, error: message, source: "firebase" };
  }

  /**
   * Essayer les différents fallbacks disponibles
   */
  private static async tryFallbacks<T>(
    functionName: string,
    data: unknown,
    fallbackValue?: T
  ): Promise<FunctionCallResult<T>> {
    if (
      functionName === "getOpenAIKey" ||
      functionName === "getManagedAPIKey"
    ) {
      return { success: false, error: "disabled", source: "fallback" };
    }

    if (fallbackValue !== undefined) {
      logger.info(
        `🔄 Utilisation de la valeur de fallback pour ${functionName}`
      );
      return { success: true, data: fallbackValue, source: "fallback" };
    }

    return {
      success: false,
      error: `Aucun fallback disponible pour ${functionName}`,
      source: "fallback",
    };
  }

  /**
   * Fallback spécifique pour la récupération des clés OpenAI
   */
  private static async fallbackGetOpenAIKey(): Promise<
    FunctionCallResult<any>
  > {
    try {
      logger.info("🔄 Tentative de fallback pour getOpenAIKey");

      // 1. Vérifier si une clé est déjà stockée localement
      const { SecureApiKeyManager } = await import("./ai/SecureApiKeyManager");
      const existingKey = await SecureApiKeyManager.getApiKey("openai");
      if (existingKey && existingKey.trim() !== "") {
        logger.info("✅ Clé OpenAI trouvée dans le stockage local");
        return {
          success: true,
          data: {
            apiKey: existingKey,
            provider: "openai",
            timestamp: new Date().toISOString(),
            source: "local_storage",
          },
          source: "fallback",
        };
      }

      // 2. Vérifier le stockage sécurisé
      try {
        const { SecureApiKeyManager } = await import(
          "./ai/SecureApiKeyManager"
        );
        const secureKey = await SecureApiKeyManager.getApiKey("openai");
        if (secureKey && secureKey.trim() !== "") {
          logger.info("✅ Clé OpenAI trouvée dans le stockage sécurisé");
          return {
            success: true,
            data: {
              apiKey: secureKey,
              provider: "openai",
              timestamp: new Date().toISOString(),
              source: "secure_storage",
            },
            source: "fallback",
          };
        }
      } catch (error) {
        logger.warn("⚠️ Impossible d'accéder au stockage sécurisé:", error);
      }

      // 3. Désactivé: les clés par défaut ne sont plus fournies
      logger.warn(
        "⚠️ Récupération de clé OpenAI par défaut désactivée côté serveur"
      );
      return {
        success: false,
        error: "Service désactivé",
        source: "fallback",
      };
    } catch (error: any) {
      logger.error("❌ Erreur dans le fallback getOpenAIKey:", error);
      return {
        success: false,
        error: error.message,
        source: "fallback",
      };
    }
  }

  /**
   * Mettre en cache le résultat d'une fonction
   */
  private static async cacheResult(
    functionName: string,
    data: any,
    result: any
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(functionName, data);
      const cacheData = {
        result,
        timestamp: Date.now(),
        functionName,
        inputData: data,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      logger.info(`💾 Résultat mis en cache: ${functionName}`);
    } catch (error) {
      logger.warn("⚠️ Erreur lors de la mise en cache:", error);
    }
  }

  /**
   * Récupérer un résultat du cache
   */
  private static async getCachedResult<T>(
    functionName: string,
    data: any,
    maxAge: number
  ): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(functionName, data);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > maxAge) {
        logger.info(`⏰ Cache expiré pour ${functionName} (âge: ${age}ms)`);
        return null;
      }

      logger.info(
        `💾 Cache valide trouvé pour ${functionName} (âge: ${age}ms)`
      );
      return cacheData.result;
    } catch (error) {
      logger.warn("⚠️ Erreur lors de la lecture du cache:", error);
      return null;
    }
  }

  /**
   * Générer une clé de cache unique
   */
  private static getCacheKey(functionName: string, data: any): string {
    const dataHash = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataHash.length; i++) {
      const chr = dataHash.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    const short = (hash >>> 0).toString(16);
    return `${this.CACHE_PREFIX}${functionName}_${short}`;
  }

  /**
   * Vérifier si une erreur ne doit pas être retryée
   */
  private static isNonRetryableError(error: unknown): boolean {
    const nonRetryableErrors = [
      "unauthenticated",
      "permission-denied",
      "invalid-argument",
      "not-found",
    ];

    const err = error as { code?: string; message?: string } | undefined;
    const errorCode = (err?.code || err?.message || "").toLowerCase();
    return nonRetryableErrors.some((code) => errorCode.includes(code));
  }

  /**
   * Attendre un délai donné
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Nettoyer le cache expiré
   */
  static async cleanExpiredCache(): Promise<void> {
    try {
      const keys = await storage.getAllKeys();
      const cacheKeys = keys.filter((key: string) =>
        key.startsWith(this.CACHE_PREFIX)
      );

      let cleanedCount = 0;

      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            if (age > this.CACHE_DURATION) {
              await AsyncStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // Supprimer les entrées corrompues
          await AsyncStorage.removeItem(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`🧹 Cache nettoyé: ${cleanedCount} entrées supprimées`);
      }
    } catch (error) {
      logger.warn("⚠️ Erreur lors du nettoyage du cache:", error);
    }
  }

  /**
   * Obtenir des statistiques sur le cache
   */
  static async getCacheStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    totalSize: number;
  }> {
    try {
      const keys = await storage.getAllKeys();
      const cacheKeys = keys.filter((key: string) =>
        key.startsWith(this.CACHE_PREFIX)
      );

      let totalEntries = 0;
      let expiredEntries = 0;
      let totalSize = 0;

      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            totalEntries++;
            totalSize += cached.length;

            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            if (age > this.CACHE_DURATION) {
              expiredEntries++;
            }
          }
        } catch (error) {
          // Entrée corrompue
          expiredEntries++;
        }
      }

      return {
        totalEntries,
        expiredEntries,
        totalSize,
      };
    } catch (error) {
      logger.warn("⚠️ Erreur lors du calcul des stats du cache:", error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        totalSize: 0,
      };
    }
  }
}

// Nettoyer automatiquement le cache au démarrage
FirebaseFunctionsFallbackService.cleanExpiredCache().catch(() => {
  // Ignorer les erreurs de nettoyage
});
