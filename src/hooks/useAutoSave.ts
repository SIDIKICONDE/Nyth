import { useCallback, useEffect, useRef, useState } from "react";
import AutoSaveService, {
  AutoSaveConfig,
  BackupMetadata,
} from "../services/AutoSaveService";
import { Recording, Script } from "../types";

interface UseAutoSaveReturn {
  // Configuration
  config: AutoSaveConfig;
  updateConfig: (newConfig: Partial<AutoSaveConfig>) => Promise<void>;

  // Sauvegarde de scripts
  startAutoSaveScript: (
    scriptId: string,
    getScriptData: () => Partial<Script>
  ) => void;
  stopAutoSave: (itemId: string) => void;

  // Sauvegarde d'enregistrements
  saveRecording: (recording: Recording) => Promise<void>;

  // Gestion des sauvegardes
  getAvailableBackups: (
    type?: "script" | "recording"
  ) => Promise<BackupMetadata[]>;
  restoreScript: (backupId: string) => Promise<Script | null>;

  // Statistiques
  backupStats: {
    totalBackups: number;
    scriptBackups: number;
    recordingBackups: number;
    totalSize: number;
    lastBackup: number | null;
  };
  refreshStats: () => Promise<void>;

  // État
  isAutoSaveActive: boolean;
  lastSaveTime: number | null;
}

export function useAutoSave(): UseAutoSaveReturn {
  const autoSaveService = useRef(AutoSaveService.getInstance());
  const [config, setConfig] = useState<AutoSaveConfig>({
    enabled: true,
    interval: 120000,
    cloudBackup: false,
    maxLocalBackups: 10,
    maxCloudBackups: 5,
  });
  const [backupStats, setBackupStats] = useState({
    totalBackups: 0,
    scriptBackups: 0,
    recordingBackups: 0,
    totalSize: 0,
    lastBackup: null as number | null,
  });
  const [isAutoSaveActive, setIsAutoSaveActive] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const activeTimers = useRef<Set<string>>(new Set());

  // Charger la configuration au montage
  useEffect(() => {
    loadInitialConfig();
    refreshStats();

    return () => {
      // Nettoyer les timers au démontage
      autoSaveService.current.cleanup();
    };
  }, []);

  const loadInitialConfig = async () => {
    try {
      // La configuration est chargée automatiquement par le service
      // On peut récupérer la config actuelle si nécessaire
      await refreshStats();
    } catch (error) {}
  };

  const updateConfig = async (newConfig: Partial<AutoSaveConfig>) => {
    try {
      await autoSaveService.current.updateConfig(newConfig);
      setConfig((prev) => ({ ...prev, ...newConfig }));
    } catch (error) {
      throw error;
    }
  };

  const startAutoSaveScript = (
    scriptId: string,
    getScriptData: () => Partial<Script>
  ) => {
    try {
      autoSaveService.current.startAutoSaveScript(scriptId, getScriptData);
      activeTimers.current.add(scriptId);
      setIsAutoSaveActive(activeTimers.current.size > 0);
    } catch (error) {}
  };

  const stopAutoSave = (itemId: string) => {
    try {
      autoSaveService.current.stopAutoSave(itemId);
      activeTimers.current.delete(itemId);
      setIsAutoSaveActive(activeTimers.current.size > 0);
    } catch (error) {}
  };

  const saveRecording = async (recording: Recording) => {
    try {
      await autoSaveService.current.startAutoSaveRecording(recording);
      setLastSaveTime(Date.now());
      await refreshStats();
    } catch (error) {
      throw error;
    }
  };

  const getAvailableBackups = async (
    type?: "script" | "recording"
  ): Promise<BackupMetadata[]> => {
    try {
      return await autoSaveService.current.getAvailableBackups(type);
    } catch (error) {
      return [];
    }
  };

  const restoreScript = async (backupId: string): Promise<Script | null> => {
    try {
      const restoredScript = await autoSaveService.current.restoreScript(
        backupId
      );
      if (restoredScript) {}
      return restoredScript;
    } catch (error) {
      return null;
    }
  };

  const refreshStats = async () => {
    try {
      const stats = await autoSaveService.current.getBackupStats();
      setBackupStats(stats);
    } catch (error) {}
  };

  return {
    config,
    updateConfig,
    startAutoSaveScript,
    stopAutoSave,
    saveRecording,
    getAvailableBackups,
    restoreScript,
    backupStats,
    refreshStats,
    isAutoSaveActive,
    lastSaveTime,
  };
}

// Hook spécialisé pour l'auto-save de scripts dans l'éditeur
export function useScriptAutoSave(
  scriptId: string,
  title: string,
  content: string
) {
  const { startAutoSaveScript, stopAutoSave, isAutoSaveActive } = useAutoSave();
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);
  const lastContentRef = useRef({ title, content });
  const savedContentRef = useRef({ title, content });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Détecter les changements significatifs de contenu
  const hasSignificantChanges = useCallback(() => {
    // Si le contenu actuel est différent du dernier contenu sauvegardé
    return (
      content !== savedContentRef.current.content ||
      title !== savedContentRef.current.title
    );
  }, [title, content]);

  // Fonction pour mettre à jour le timestamp de dernière sauvegarde
  const updateLastSaveTime = useCallback(() => {
    if (isAutoSaveActive) {
      setLastAutoSave(Date.now());
      savedContentRef.current = { title, content };
    }
  }, [isAutoSaveActive, title, content]);

  // Réagir aux changements de contenu
  useEffect(() => {
    if (scriptId && (title || content)) {
      // Détecter si le contenu a changé
      const contentChanged =
        title !== lastContentRef.current.title ||
        content !== lastContentRef.current.content;

      // Stocker la dernière valeur du contenu
      if (contentChanged) {
        lastContentRef.current = { title, content };

        // Programmer une sauvegarde après un délai (debouncing)
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Si des changements significatifs sont détectés, planifier une sauvegarde
        if (hasSignificantChanges()) {
          saveTimeoutRef.current = setTimeout(() => {
            updateLastSaveTime();
          }, 1000); // Délai de 1 seconde après la dernière modification
        }
      }

      // Fonction pour récupérer les données du script
      const getScriptData = () => {
        // Mettre à jour la référence du contenu sauvegardé
        savedContentRef.current = { title, content };
        // Déclencher la notification de sauvegarde
        updateLastSaveTime();

        return {
          title,
          content,
          updatedAt: new Date().toISOString(),
        };
      };

      // Démarrer l'auto-sauvegarde
      startAutoSaveScript(scriptId, getScriptData);

      return () => {
        stopAutoSave(scriptId);
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }

    // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
    return () => {};
  }, [
    scriptId,
    title,
    content,
    startAutoSaveScript,
    stopAutoSave,
    isAutoSaveActive,
    hasSignificantChanges,
    updateLastSaveTime,
  ]);

  return {
    isAutoSaveActive,
    lastAutoSave,
  };
}

// Hook pour la gestion des sauvegardes dans les paramètres
export function useBackupManager() {
  const {
    config,
    updateConfig,
    getAvailableBackups,
    backupStats,
    refreshStats,
  } = useAutoSave();

  const [isLoading, setIsLoading] = useState(false);

  const enableAutoSave = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      await updateConfig({ enabled });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const enableCloudBackup = async (cloudBackup: boolean) => {
    setIsLoading(true);
    try {
      if (cloudBackup) {
        throw new Error(
          "La sauvegarde cloud n'est pas disponible pour le moment."
        );
      }
      await updateConfig({ cloudBackup });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInterval = async (interval: number) => {
    setIsLoading(true);
    try {
      await updateConfig({ interval });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupOldBackups = async () => {
    setIsLoading(true);
    try {
      await AutoSaveService.getInstance().cleanupAllBackups();
      await refreshStats();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupRedundantBackups = async () => {
    setIsLoading(true);
    try {
      await AutoSaveService.getInstance().cleanupRedundantBackups();
      await refreshStats();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const formatBackupSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatLastBackup = (timestamp: number | null): string => {
    if (!timestamp) return "Aucune sauvegarde";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
    return "À l'instant";
  };

  return {
    config,
    backupStats,
    isLoading,
    enableAutoSave,
    enableCloudBackup,
    updateInterval,
    cleanupOldBackups,
    cleanupRedundantBackups,
    refreshStats,
    getAvailableBackups,
    formatBackupSize,
    formatLastBackup,
  };
}
