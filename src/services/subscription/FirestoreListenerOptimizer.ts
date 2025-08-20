import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../utils/optimizedLogger";
import { UserSubscription } from "../../types/subscription";

const logger = createLogger("FirestoreListenerOptimizer");

interface ListenerConfig {
  collectionName: string;
  filters?: Array<{
    field: string;
    operator: '==' | '>' | '<' | '>=' | '<=' | 'in' | 'array-contains';
    value: any;
  }>;
  batchSize: number;
  debounceMs: number;
}

interface ListenerGroup {
  id: string;
  config: ListenerConfig;
  listeners: Map<string, Unsubscribe>;
  subscribers: Map<string, (data: any[]) => void>;
  lastUpdate: number;
  batchBuffer: any[];
  debounceTimer?: NodeJS.Timeout;
}

/**
 * Service d'optimisation des listeners Firestore
 * Réduit les connexions multiples et optimise les performances
 */
class FirestoreListenerOptimizer {
  private static instance: FirestoreListenerOptimizer;
  private groups = new Map<string, ListenerGroup>();
  private db = getFirestore(getApp());

  static getInstance(): FirestoreListenerOptimizer {
    if (!FirestoreListenerOptimizer.instance) {
      FirestoreListenerOptimizer.instance = new FirestoreListenerOptimizer();
    }
    return FirestoreListenerOptimizer.instance;
  }

  /**
   * Créer ou rejoindre un groupe de listeners optimisé
   */
  createOptimizedListener(
    groupId: string,
    config: ListenerConfig,
    subscriberId: string,
    callback: (data: any[]) => void
  ): Unsubscribe {
    // Créer le groupe s'il n'existe pas
    if (!this.groups.has(groupId)) {
      this.createListenerGroup(groupId, config);
    }

    const group = this.groups.get(groupId)!;

    // Ajouter le subscriber
    group.subscribers.set(subscriberId, callback);

    // Notifier avec les données actuelles si disponibles
    if (group.batchBuffer.length > 0) {
      callback(group.batchBuffer);
    }

    logger.info(`✅ Subscriber ${subscriberId} ajouté au groupe ${groupId}`);

    // Retourner la fonction de désabonnement
    return () => {
      this.removeSubscriber(groupId, subscriberId);
    };
  }

  /**
   * Créer un groupe de listeners optimisé
   */
  private createListenerGroup(groupId: string, config: ListenerConfig): void {
    const group: ListenerGroup = {
      id: groupId,
      config,
      listeners: new Map(),
      subscribers: new Map(),
      lastUpdate: 0,
      batchBuffer: [],
    };

    // Créer le listener principal
    this.setupMainListener(group);

    this.groups.set(groupId, group);
    logger.info(`📡 Groupe de listeners créé: ${groupId}`);
  }

  /**
   * Configurer le listener principal pour un groupe
   */
  private setupMainListener(group: ListenerGroup): void {
    let firestoreQuery = collection(this.db, group.config.collectionName);

    // Appliquer les filtres
    if (group.config.filters) {
      const queryConstraints = group.config.filters.map(filter =>
        where(filter.field, filter.operator, filter.value)
      );
      firestoreQuery = query(firestoreQuery, ...queryConstraints);
    }

    const unsubscribe = onSnapshot(
      firestoreQuery,
      (snapshot) => {
        this.handleSnapshotUpdate(group, snapshot);
      },
      (error) => {
        logger.error(`❌ Erreur listener groupe ${group.id}:`, error);
        this.handleListenerError(group);
      }
    );

    group.listeners.set('main', unsubscribe);
  }

  /**
   * Gérer les mises à jour des snapshots
   */
  private handleSnapshotUpdate(group: ListenerGroup, snapshot: any): void {
    const now = Date.now();

    // Éviter les mises à jour trop fréquentes
    if (now - group.lastUpdate < group.config.debounceMs) {
      // Annuler le timer précédent
      if (group.debounceTimer) {
        clearTimeout(group.debounceTimer);
      }

      // Programmer une mise à jour
      group.debounceTimer = setTimeout(() => {
        this.processSnapshotUpdate(group, snapshot);
      }, group.config.debounceMs - (now - group.lastUpdate));

      return;
    }

    this.processSnapshotUpdate(group, snapshot);
  }

  /**
   * Traiter la mise à jour du snapshot
   */
  private processSnapshotUpdate(group: ListenerGroup, snapshot: any): void {
    group.lastUpdate = Date.now();

    const data = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    group.batchBuffer = data;

    // Notifier tous les subscribers
    group.subscribers.forEach((callback, subscriberId) => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`❌ Erreur callback subscriber ${subscriberId}:`, error);
      }
    });

    logger.debug(`📡 Mise à jour groupe ${group.id}: ${data.length} documents`);
  }

  /**
   * Gérer les erreurs de listeners
   */
  private handleListenerError(group: ListenerGroup): void {
    // Tenter de recréer le listener après un délai
    setTimeout(() => {
      logger.info(`🔄 Tentative recréation listener groupe ${group.id}`);
      this.setupMainListener(group);
    }, 5000);
  }

  /**
   * Retirer un subscriber d'un groupe
   */
  private removeSubscriber(groupId: string, subscriberId: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    group.subscribers.delete(subscriberId);
    logger.info(`👋 Subscriber ${subscriberId} retiré du groupe ${groupId}`);

    // Nettoyer le groupe s'il n'y a plus de subscribers
    if (group.subscribers.size === 0) {
      this.cleanupGroup(groupId);
    }
  }

  /**
   * Nettoyer un groupe complet
   */
  private cleanupGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    // Désabonner tous les listeners
    group.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });

    // Annuler les timers
    if (group.debounceTimer) {
      clearTimeout(group.debounceTimer);
    }

    this.groups.delete(groupId);
    logger.info(`🧹 Groupe ${groupId} nettoyé`);
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  getStats() {
    const stats = {
      totalGroups: this.groups.size,
      totalSubscribers: Array.from(this.groups.values()).reduce(
        (sum, group) => sum + group.subscribers.size,
        0
      ),
      groups: Array.from(this.groups.entries()).map(([id, group]) => ({
        id,
        subscribers: group.subscribers.size,
        lastUpdate: group.lastUpdate,
        bufferSize: group.batchBuffer.length,
      })),
    };

    return stats;
  }

  /**
   * Forcer le nettoyage de tous les groupes
   */
  cleanupAll(): void {
    logger.info('🧹 Nettoyage forcé de tous les groupes');
    Array.from(this.groups.keys()).forEach(groupId => {
      this.cleanupGroup(groupId);
    });
  }
}

// Configuration pour les abonnements
export const SUBSCRIPTION_LISTENER_CONFIG: ListenerConfig = {
  collectionName: 'subscriptions',
  filters: [
    { field: 'status', operator: '==', value: 'active' },
  ],
  batchSize: 50,
  debounceMs: 1000,
};

// Configuration pour les stats d'usage
export const USAGE_LISTENER_CONFIG: ListenerConfig = {
  collectionName: 'usage_stats',
  batchSize: 100,
  debounceMs: 5000, // Moins fréquent pour les stats d'usage
};

// Instance singleton
export const firestoreListenerOptimizer = FirestoreListenerOptimizer.getInstance();

// Hooks React pour utiliser les listeners optimisés
export const useOptimizedSubscriptionListener = (
  subscriberId: string,
  callback: (subscriptions: UserSubscription[]) => void
) => {
  React.useEffect(() => {
    const unsubscribe = firestoreListenerOptimizer.createOptimizedListener(
      'subscriptions',
      SUBSCRIPTION_LISTENER_CONFIG,
      subscriberId,
      callback
    );

    return unsubscribe;
  }, [subscriberId, callback]);
};

export default firestoreListenerOptimizer;
