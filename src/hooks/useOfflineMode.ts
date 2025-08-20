/**
 * Hook pour gérer le mode hors ligne de l'application
 */

import { useEffect, useState, useCallback } from "react";
import { offlineManager } from "../services/OfflineManager";
import { useAuth } from "../contexts/AuthContext";
import { createLogger } from "../utils/optimizedLogger";
import type { OfflineStatus, OfflineOperation } from "../types/offline";

const logger = createLogger("useOfflineMode");

export function useOfflineMode() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: true,
    isOfflineMode: false,
    hasCachedData: false,
    pendingOperationsCount: 0,
  });

  // Mettre à jour le statut
  const updateStatus = useCallback(async () => {
    const isOnline = offlineManager.getIsOnline();
    const hasCachedData = await offlineManager.hasOfflineData();
    const stats = await offlineManager.getOfflineStats();
    
    setStatus({
      isOnline,
      isOfflineMode: !isOnline,
      hasCachedData,
      pendingOperationsCount: stats.pendingOperations,
    });
  }, []);

  // S'abonner aux changements d'état réseau
  useEffect(() => {
    // Mise à jour initiale
    updateStatus();

    // S'abonner aux changements
    const unsubscribe = offlineManager.subscribe((isOnline) => {
      logger.info(`📡 Changement d'état réseau détecté: ${isOnline ? "En ligne" : "Hors ligne"}`);
      updateStatus();
    });

    return () => {
      unsubscribe();
    };
  }, [updateStatus]);

  // Sauvegarder les données utilisateur en cache quand elles changent
  useEffect(() => {
    if (user) {
      offlineManager.saveOfflineData('user', user).catch((error) => {
        logger.error("Erreur lors de la sauvegarde des données utilisateur hors ligne:", error);
      });
    }
  }, [user]);

  /**
   * Sauvegarde des données pour le mode hors ligne
   */
  const saveForOffline = useCallback(async (key: string, data: any) => {
    try {
      await offlineManager.saveOfflineData(key, data);
      await updateStatus();
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde hors ligne de ${key}:`, error);
      return false;
    }
  }, [updateStatus]);

  /**
   * Récupération des données hors ligne
   */
  const getFromOffline = useCallback(async (key: string) => {
    try {
      return await offlineManager.getOfflineData(key);
    } catch (error) {
      logger.error(`Erreur lors de la récupération hors ligne de ${key}:`, error);
      return null;
    }
  }, []);

  /**
   * Ajoute une opération à synchroniser plus tard
   */
  const addPendingOperation = useCallback(async (operation: OfflineOperation) => {
    await offlineManager.addPendingOperation(operation);
    await updateStatus();
  }, [updateStatus]);

  /**
   * Efface toutes les données hors ligne
   */
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineManager.clearOfflineData();
      await updateStatus();
      logger.info("✅ Données hors ligne effacées");
      return true;
    } catch (error) {
      logger.error("Erreur lors de l'effacement des données hors ligne:", error);
      return false;
    }
  }, [updateStatus]);

  /**
   * Force une tentative de synchronisation
   */
  const forceSyncAttempt = useCallback(async () => {
    if (!status.isOnline) {
      logger.warn("⚠️ Impossible de synchroniser : pas de connexion");
      return false;
    }

    try {
      logger.info("🔄 Tentative de synchronisation forcée...");
      // La synchronisation sera gérée automatiquement par l'OfflineManager
      await updateStatus();
      return true;
    } catch (error) {
      logger.error("Erreur lors de la synchronisation forcée:", error);
      return false;
    }
  }, [status.isOnline, updateStatus]);

  return {
    // État
    ...status,
    
    // Actions
    saveForOffline,
    getFromOffline,
    addPendingOperation,
    clearOfflineData,
    forceSyncAttempt,
    
    // Utilitaires
    isFullyOffline: status.isOfflineMode && !status.hasCachedData,
    canWorkOffline: status.hasCachedData || status.isOnline,
  };
}