/**
 * Service de gestion du mode hors ligne
 * Permet à l'application de fonctionner sans connexion internet
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { createLogger } from "../utils/optimizedLogger";
import type { 
  IOfflineManager, 
  OfflineOperation, 
  OfflineStats, 
  NetworkStateListener,
  CachedData 
} from "../types/offline";

const logger = createLogger("OfflineManager");

// Interface pour les données hors ligne (peut être étendue selon les besoins)
// interface OfflineData {
//   scripts: any[];
//   userProfile: any;
//   preferences: any;
//   lastSync: Date;
// }

class OfflineManager implements IOfflineManager {
  private isOnline: boolean = true;
  private listeners: NetworkStateListener[] = [];
  private unsubscribeNetInfo: (() => void) | null = null;
  private pendingOperations: OfflineOperation[] = [];

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Initialise l'écouteur de changement d'état réseau
   */
  private initializeNetworkListener() {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true && state.isInternetReachable !== false;
      
      if (wasOnline !== this.isOnline) {
        logger.info(`📡 État réseau changé: ${this.isOnline ? "En ligne" : "Hors ligne"}`);
        this.notifyListeners();
        
        if (this.isOnline) {
          // Synchroniser les données en attente quand on revient en ligne
          this.syncPendingOperations();
        }
      }
    });

    // Vérifier l'état initial
    NetInfo.fetch().then((state) => {
      this.isOnline = state.isConnected === true && state.isInternetReachable !== false;
      logger.info(`📡 État réseau initial: ${this.isOnline ? "En ligne" : "Hors ligne"}`);
    });
  }

  /**
   * Vérifie si l'application est en ligne
   */
  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * S'abonner aux changements d'état réseau
   */
  public subscribe(callback: NetworkStateListener): () => void {
    this.listeners.push(callback);
    
    // Retourner une fonction de désabonnement
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notifie tous les listeners du changement d'état
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.isOnline);
      } catch (error) {
        logger.error("Erreur lors de la notification du listener:", error);
      }
    });
  }

  /**
   * Sauvegarde les données localement pour le mode hors ligne
   */
  public async saveOfflineData<T>(key: string, data: T): Promise<void> {
    try {
      const offlineKey = `@offline_${key}`;
      const cachedData: CachedData<T> = {
        data,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(offlineKey, JSON.stringify(cachedData));
      logger.info(`💾 Données sauvegardées hors ligne: ${key}`);
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde hors ligne de ${key}:`, error);
    }
  }

  /**
   * Récupère les données sauvegardées localement
   */
  public async getOfflineData<T>(key: string): Promise<T | null> {
    try {
      const offlineKey = `@offline_${key}`;
      const stored = await AsyncStorage.getItem(offlineKey);
      
      if (stored) {
        const { data, timestamp } = JSON.parse(stored) as CachedData<T>;
        logger.info(`📂 Données récupérées hors ligne: ${key} (${timestamp})`);
        return data;
      }
      
      return null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération hors ligne de ${key}:`, error);
      return null;
    }
  }

  /**
   * Ajoute une opération à synchroniser quand la connexion reviendra
   */
  public async addPendingOperation(operation: OfflineOperation): Promise<void> {
    this.pendingOperations.push({
      ...operation,
      timestamp: new Date().toISOString(),
    });
    
    // Sauvegarder les opérations en attente
    await this.savePendingOperations();
    
    logger.info(`⏳ Opération ajoutée en attente: ${operation.type}`);
  }

  /**
   * Sauvegarde les opérations en attente dans AsyncStorage
   */
  private async savePendingOperations() {
    try {
      await AsyncStorage.setItem(
        "@pending_operations",
        JSON.stringify(this.pendingOperations)
      );
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde des opérations en attente:", error);
    }
  }

  /**
   * Charge les opérations en attente depuis AsyncStorage
   */
  public async loadPendingOperations() {
    try {
      const stored = await AsyncStorage.getItem("@pending_operations");
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
        logger.info(`📥 ${this.pendingOperations.length} opérations en attente chargées`);
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des opérations en attente:", error);
    }
  }

  /**
   * Synchronise les opérations en attente quand on revient en ligne
   */
  private async syncPendingOperations() {
    if (this.pendingOperations.length === 0) return;
    
    logger.info(`🔄 Synchronisation de ${this.pendingOperations.length} opérations en attente...`);
    
    const remainingOperations: OfflineOperation[] = [];
    
    for (const operation of this.pendingOperations) {
      try {
        await operation.action();
        logger.info(`✅ Opération synchronisée: ${operation.type}`);
      } catch (error) {
        logger.error(`❌ Échec de synchronisation: ${operation.type}`, error);
        remainingOperations.push(operation); // Garder l'opération pour une prochaine tentative
      }
    }
    
    this.pendingOperations = remainingOperations;
    await this.savePendingOperations();
    
    if (remainingOperations.length > 0) {
      logger.warn(`⚠️ ${remainingOperations.length} opérations n'ont pas pu être synchronisées et seront réessayées plus tard.`);
    } else {
      logger.info("✅ Toutes les opérations ont été synchronisées avec succès");
    }
  }

  /**
   * Nettoie les ressources
   */
  public cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.listeners = [];
  }

  /**
   * Vérifie si des données sont disponibles hors ligne
   */
  public async hasOfflineData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.some(key => key.startsWith("@offline_"));
    } catch (error) {
      logger.error("Erreur lors de la vérification des données hors ligne:", error);
      return false;
    }
  }

  /**
   * Efface toutes les données hors ligne
   */
  public async clearOfflineData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith("@offline_"));
      
      if (offlineKeys.length > 0) {
        await AsyncStorage.multiRemove(offlineKeys);
        logger.info(`🗑️ ${offlineKeys.length} données hors ligne effacées`);
      }
    } catch (error) {
      logger.error("Erreur lors de l'effacement des données hors ligne:", error);
    }
  }

  /**
   * Obtient des statistiques sur l'utilisation hors ligne
   */
  public async getOfflineStats(): Promise<OfflineStats> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith("@offline_"));
      
      let totalSize = 0;
      for (const key of offlineKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return {
        dataCount: offlineKeys.length,
        pendingOperations: this.pendingOperations.length,
        cacheSize: totalSize,
      };
    } catch (error) {
      logger.error("Erreur lors du calcul des statistiques hors ligne:", error);
      return {
        dataCount: 0,
        pendingOperations: 0,
        cacheSize: 0,
      };
    }
  }
}

// Singleton
export const offlineManager = new OfflineManager();