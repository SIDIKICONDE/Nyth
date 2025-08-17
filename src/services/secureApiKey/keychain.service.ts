import { Platform } from "react-native";
import { createLogger } from "../../utils/optimizedLogger";
import { getPlatformInfo, getSecureStorageConfig } from "../platformConfig";
import { shouldDisableKeychain } from "../forceDisableKeychain";

const logger = createLogger("KeychainService");

// Import conditionnel pour éviter les erreurs sur les plateformes non supportées
let Keychain: typeof import("react-native-keychain") | null = null;
let KEYCHAIN_AVAILABLE = false;

try {
  // Essayer d'importer Keychain uniquement si on est sur mobile
  if (Platform.OS === "ios" || Platform.OS === "android") {
    Keychain = require("react-native-keychain");
    // Vérifier que les méthodes nécessaires existent
    if (
      Keychain &&
      typeof Keychain.setInternetCredentials === "function" &&
      typeof Keychain.getInternetCredentials === "function"
    ) {
      KEYCHAIN_AVAILABLE = true;
      logger.info("✅ Keychain chargé avec succès");
    } else {
      logger.warn("⚠️ Keychain chargé mais méthodes manquantes");
    }
  }
} catch (error) {
  logger.warn(
    "❌ react-native-keychain non disponible sur cette plateforme:",
    error
  );
  KEYCHAIN_AVAILABLE = false;
}

// Configuration de la plateforme
const platformInfo = getPlatformInfo();
const storageConfig = getSecureStorageConfig();

// Logs de configuration
logger.info(`Platform info:`, platformInfo);
logger.info(`Storage config:`, storageConfig);

// Vérification supplémentaire pour Windows
const isDefinitelyWindows =
  platformInfo.isWindows ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.OS === "Windows_NT");

if (isDefinitelyWindows) {
  logger.warn("⚠️ Windows détecté - Forçage de la désactivation de Keychain");
}

// Vérifier si Keychain doit être forcément désactivé
const forceDisable = shouldDisableKeychain();
if (forceDisable) {
  logger.warn("⚠️ Keychain forcément désactivé par configuration");
}

// Export des configurations
export const USE_KEYCHAIN =
  !forceDisable &&
  KEYCHAIN_AVAILABLE &&
  storageConfig.useKeychain &&
  !isDefinitelyWindows;
export const STORAGE_PREFIX = storageConfig.storagePrefix;

logger.info(`KEYCHAIN_AVAILABLE: ${KEYCHAIN_AVAILABLE}`);
logger.info(`forceDisable: ${forceDisable}`);
logger.info(`USE_KEYCHAIN final: ${USE_KEYCHAIN}`);

export class KeychainService {
  static isAvailable(): boolean {
    return USE_KEYCHAIN;
  }

  static async setInternetCredentials(
    server: string,
    username: string,
    password: string,
    options?: {
      accessible?: any;
      accessControl?: any;
      authenticationPrompt?: {
        title?: string;
        subtitle?: string;
        description?: string;
        cancel?: string;
      };
    }
  ): Promise<void> {
    if (!USE_KEYCHAIN || !Keychain) {
      throw new Error("Keychain non disponible");
    }

    try {
      const strongOptions = {
        accessible: Keychain.ACCESSIBLE?.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        accessControl: Keychain.ACCESS_CONTROL?.BIOMETRY_CURRENT_SET,
        ...options,
      };
      await Keychain.setInternetCredentials(
        server,
        username,
        password,
        strongOptions as any
      );
    } catch (error) {
      logger.error("Erreur setInternetCredentials:", error);
      throw error;
    }
  }

  static async getInternetCredentials(
    server: string
  ): Promise<import("react-native-keychain").UserCredentials | null> {
    if (!USE_KEYCHAIN || !Keychain) {
      return null;
    }

    try {
      const result = await Keychain.getInternetCredentials(server);
      if (result === false) return null;
      return result;
    } catch (error) {
      logger.error("Erreur getInternetCredentials:", error);
      return null;
    }
  }

  static async resetInternetCredentials(options: {
    server: string;
  }): Promise<void> {
    if (!USE_KEYCHAIN || !Keychain) {
      return;
    }

    try {
      await Keychain.resetInternetCredentials(options);
    } catch (error) {
      logger.error("Erreur resetInternetCredentials:", error);
    }
  }

  static getAccessibleOption(): any {
    if (Keychain && Keychain.ACCESSIBLE) {
      return Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
    }
    return null;
  }
}
