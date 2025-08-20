import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "@/utils/optimizedLogger";
import { AsyncStorageValidator } from "@/utils/asyncStorageValidator";

const logger = createLogger("PermissionCacheService");

export enum PermissionType {
  CAMERA = "camera",
  MICROPHONE = "microphone",
  PHOTO_LIBRARY = "photo_library",
  PHOTO_LIBRARY_ADD_ONLY = "photo_library_add_only",
  WRITE_EXTERNAL_STORAGE = "write_external_storage",
  READ_EXTERNAL_STORAGE = "read_external_storage",
  READ_MEDIA_VIDEO = "read_media_video",
  READ_MEDIA_IMAGES = "read_media_images",
}

export enum PermissionStatus {
  GRANTED = "granted",
  DENIED = "denied",
  LIMITED = "limited",
  BLOCKED = "blocked",
  UNAVAILABLE = "unavailable",
  UNKNOWN = "unknown",
}

interface CachedPermission {
  status: PermissionStatus;
  timestamp: number;
  expiresAt: number;
}

interface PermissionCache {
  [key: string]: CachedPermission;
}

/**
 * Service centralisé de gestion et cache des permissions
 * Évite les demandes répétées de permissions déjà accordées/réfusées
 */
export class PermissionCacheService {
  private static instance: PermissionCacheService;
  private cache: PermissionCache = {};
  private readonly CACHE_KEY = "permission_cache";
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
  private initialized = false;

  static getInstance(): PermissionCacheService {
    if (!PermissionCacheService.instance) {
      PermissionCacheService.instance = new PermissionCacheService();
    }
    return PermissionCacheService.instance;
  }

  private constructor() {
    this.loadCache();
  }

  /**
   * Initialise le cache en chargeant les données depuis AsyncStorage
   * Inclut la validation de corruption
   */
  private async loadCache(): Promise<void> {
    try {
      if (this.initialized) return;

      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        try {
          const parsedCache: PermissionCache = JSON.parse(cachedData);

          // Valider et nettoyer les données corrompues
          const validationResult = await AsyncStorageValidator.validateAndRepair({
            keys: [this.CACHE_KEY],
            autoRepair: true,
            removeCorrupted: false // Ne pas supprimer, essayer de réparer
          });

          if (!validationResult.isValid && validationResult.repairedKeys.length === 0) {
            logger.warn("Cache des permissions corrompu et non réparable, réinitialisation", validationResult.errors);
            this.cache = {};
          } else {
            // Nettoyer les entrées expirées
            const now = Date.now();
            Object.keys(parsedCache).forEach(key => {
              if (parsedCache[key].expiresAt < now) {
                delete parsedCache[key];
              }
            });

            this.cache = parsedCache;
            logger.debug("Cache des permissions chargé", {
              entries: Object.keys(this.cache).length,
              wasRepaired: validationResult.repairedKeys.length > 0
            });
          }
        } catch (parseError) {
          logger.warn("Cache des permissions corrompu, réinitialisation", parseError);
          this.cache = {};

          // Tenter de réparer la clé corrompue
          await AsyncStorageValidator.validateAndRepair({
            keys: [this.CACHE_KEY],
            autoRepair: true,
            removeCorrupted: true
          });
        }
      } else {
        this.cache = {};
      }

      this.initialized = true;
    } catch (error) {
      logger.error("Erreur lors du chargement du cache des permissions", error);
      this.cache = {};
      this.initialized = true;
    }
  }

  /**
   * Sauvegarde le cache dans AsyncStorage
   */
  private async saveCache(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
      logger.debug("Cache des permissions sauvegardé");
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde du cache des permissions", error);
    }
  }

  /**
   * Génère une clé unique pour une permission
   */
  private getCacheKey(type: PermissionType, platform?: string): string {
    const platformKey = platform || Platform.OS;
    return `${type}_${platformKey}`;
  }

  /**
   * Vérifie si une permission est en cache et valide
   */
  private getCachedPermission(type: PermissionType): CachedPermission | null {
    const key = this.getCacheKey(type);
    const cached = this.cache[key];

    if (!cached) return null;

    // Vérifier si le cache est encore valide
    if (Date.now() > cached.expiresAt) {
      delete this.cache[key];
      this.saveCache();
      return null;
    }

    return cached;
  }

  /**
   * Met en cache le statut d'une permission
   */
  private async setCachedPermission(
    type: PermissionType,
    status: PermissionStatus,
    duration: number = this.CACHE_DURATION
  ): Promise<void> {
    const key = this.getCacheKey(type);
    const now = Date.now();

    this.cache[key] = {
      status,
      timestamp: now,
      expiresAt: now + duration,
    };

    await this.saveCache();
    logger.debug("Permission mise en cache", { type, status, duration });
  }

  /**
   * Vérifie si une permission est accordée (avec cache)
   */
  async isPermissionGranted(type: PermissionType): Promise<boolean> {
    await this.loadCache();

    const cached = this.getCachedPermission(type);
    if (cached) {
      const granted = cached.status === PermissionStatus.GRANTED ||
                      cached.status === PermissionStatus.LIMITED;

      logger.debug("Permission trouvée en cache", {
        type,
        status: cached.status,
        granted
      });

      return granted;
    }

    logger.debug("Permission non trouvée en cache", { type });
    return false;
  }

  /**
   * Obtient le statut d'une permission depuis le cache
   */
  async getCachedPermissionStatus(type: PermissionType): Promise<PermissionStatus | null> {
    await this.loadCache();

    const cached = this.getCachedPermission(type);
    return cached ? cached.status : null;
  }

  /**
   * Met à jour le cache avec le résultat d'une demande de permission
   */
  async updatePermissionCache(
    type: PermissionType,
    granted: boolean,
    limited: boolean = false
  ): Promise<void> {
    let status: PermissionStatus;

    if (granted && limited) {
      status = PermissionStatus.LIMITED;
    } else if (granted) {
      status = PermissionStatus.GRANTED;
    } else {
      status = PermissionStatus.DENIED;
    }

    // Pour les permissions refusées, utiliser une durée de cache plus courte
    const cacheDuration = granted ? this.CACHE_DURATION : 60 * 60 * 1000; // 1 heure pour refusées

    await this.setCachedPermission(type, status, cacheDuration);
  }

  /**
   * Invalide le cache d'une permission spécifique
   */
  async invalidatePermissionCache(type: PermissionType): Promise<void> {
    const key = this.getCacheKey(type);
    delete this.cache[key];
    await this.saveCache();
    logger.debug("Cache de permission invalidé", { type });
  }

  /**
   * Nettoie tout le cache des permissions
   */
  async clearCache(): Promise<void> {
    this.cache = {};
    await AsyncStorage.removeItem(this.CACHE_KEY);
    logger.debug("Cache des permissions nettoyé");
  }

  /**
   * Obtient les statistiques du cache
   */
  getCacheStats(): { total: number; granted: number; denied: number; expired: number } {
    const now = Date.now();
    let granted = 0, denied = 0, expired = 0;

    Object.values(this.cache).forEach(cached => {
      if (cached.expiresAt < now) {
        expired++;
      } else if (cached.status === PermissionStatus.GRANTED || cached.status === PermissionStatus.LIMITED) {
        granted++;
      } else {
        denied++;
      }
    });

    return {
      total: Object.keys(this.cache).length,
      granted,
      denied,
      expired
    };
  }

  /**
   * Vérifie si le cache est initialisé
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
