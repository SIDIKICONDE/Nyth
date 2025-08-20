import { Platform } from "react-native";
import { createLogger } from "../../utils/optimizedLogger";
import { getPlatformInfo, getSecureStorageConfig } from "../platformConfig";
import { shouldDisableKeychain } from "../forceDisableKeychain";

const logger = createLogger("KeychainService");

// Import Keychain désactivé
let Keychain: null = null;
let KEYCHAIN_AVAILABLE = false;

// Ne pas tenter d'importer Keychain

// Configuration de la plateforme
const platformInfo = getPlatformInfo();
const storageConfig = getSecureStorageConfig();

// Logs de configuration
logger.info(`Platform info:`, platformInfo);
logger.info(`Storage config:`, storageConfig);

// Forcer la désactivation
const isDefinitelyWindows = true;

if (isDefinitelyWindows) {
  logger.warn("⚠️ Keychain désactivé");
}

// Forcer la désactivation de Keychain
const forceDisable = true;
if (forceDisable) {
  logger.warn("⚠️ Keychain forcément désactivé par configuration");
}

export const USE_KEYCHAIN = false;
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
    throw new Error("Keychain non disponible");
  }

  static async getInternetCredentials(
    server: string
  ): Promise<{ username: string; password: string } | null> {
    return null;
  }

  static async resetInternetCredentials(options: {
    server: string;
  }): Promise<void> {
    return;
  }

  static getAccessibleOption(): any {
    return null;
  }
}
