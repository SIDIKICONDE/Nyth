import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Script, Recording } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useScripts } from "../../contexts/ScriptsContext";
import { useAuth } from "../../contexts/AuthContext";
import analyticsService from "../../services/firebase/analyticsService";
import RNFS from "react-native-fs";
import { adminAdvancedCacheService } from "../../services/cache/adminAdvancedCacheService";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("useHomeData");

export function useHomeData() {
  const { t } = useTranslation();
  const { scripts, deleteScript: deleteScriptFromContext } = useScripts();
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

  // 🔥 FONCTION HELPER: Charger les enregistrements depuis AsyncStorage
  const loadRecordingsFromStorage = useCallback(async (): Promise<Recording[]> => {
    try {
      const savedRecordings = await AsyncStorage.getItem("recordings");
      if (savedRecordings) {
        const recordingsData: Recording[] = JSON.parse(savedRecordings);

        const validRecordings: Recording[] = [];
        let removedCount = 0;
        for (const recording of recordingsData) {
          const videoUri = (recording as any).uri || (recording as any).videoUri;
          if (typeof videoUri !== "string" || videoUri.trim() === "") {
            removedCount += 1;
            continue;
          }
          const exists = await RNFS.exists(videoUri);
          if (exists) {
            validRecordings.push(recording);
          } else {
            removedCount += 1;
          }
        }

        // Sort by creation date (newest first)
        validRecordings.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return validRecordings;
      }
      return [];
    } catch (error) {
      logger.error("Erreur lors du chargement des enregistrements:", error);
      return [];
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      logger.info("🔄 Chargement des données avec cache intelligent...", {
        userId: user.uid,
      });

      // 🔥 CACHE OPTIMISÉ: Vérifier le cache d'abord
      const cacheKey = `home_data_${user.uid}`;
      const cachedData = await adminAdvancedCacheService.get(cacheKey) as {
        data: { recordings: Recording[]; timestamp: number };
        metadata: { timestamp: number };
      };

      if (cachedData && Date.now() - cachedData.metadata.timestamp < 2 * 60 * 1000) { // Cache de 2 minutes
        logger.info("⚡ CACHE HIT! Données chargées depuis le cache");
        setRecordings(cachedData.data.recordings || []);
        return;
      }

      // Pas de cache valide, charger depuis AsyncStorage
      await loadRecordings();

      // 🔥 METTRE EN CACHE pour les prochaines fois
      const recordingsData = await loadRecordingsFromStorage();
      await adminAdvancedCacheService.set(
        cacheKey,
        {
          recordings: recordingsData,
          timestamp: Date.now()
        },
        {
          name: 'home_recordings',
          ttl: 5, // 5 minutes
          priority: 'high' as const,
          maxSize: 3 * 1024 * 1024, // 3MB
          compression: true
        }
      );

      logger.info("✅ Données chargées et mises en cache");
    } catch (err: any) {
      logger.error("❌ Erreur lors du chargement des données:", err);
      // Fallback: charger sans cache
      await loadRecordings();
    }
  }, [user?.uid]);

  const loadRecordings = useCallback(async () => {
    try {
      const recordingsData = await loadRecordingsFromStorage();
      setRecordings(recordingsData);
    } catch (error) {
      logger.error("Erreur lors du chargement des enregistrements:", error);
      setRecordings([]);
    }
  }, [loadRecordingsFromStorage]);

  // 🔥 FONCTION D'INVALIDATION DE CACHE
  const invalidateHomeCache = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const cacheKey = `home_data_${user.uid}`;
      await adminAdvancedCacheService.invalidate(cacheKey);
      logger.info("🗑️ Cache de la page d'accueil invalidé");
    } catch (error) {
      logger.warn("Erreur lors de l'invalidation du cache:", error);
    }
  }, [user?.uid]);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev);
    if (selectionMode) {
      // If disabling selection mode, clear selections
      setSelectedScripts([]);
      setSelectedRecordings([]);
    }
  }, [selectionMode]);

  const isSelectionModeActive = useCallback(() => {
    return selectionMode;
  }, [selectionMode]);

  const toggleScriptSelection = useCallback(
    (id: string) => {
      if (!selectionMode) return;

      setSelectedScripts((prev) => {
        if (prev.includes(id)) {
          return prev.filter((scriptId) => scriptId !== id);
        } else {
          return [...prev, id];
        }
      });
    },
    [selectionMode]
  );

  const toggleRecordingSelection = useCallback(
    (id: string) => {
      if (!selectionMode) return;

      setSelectedRecordings((prev) => {
        if (prev.includes(id)) {
          return prev.filter((recordingId) => recordingId !== id);
        } else {
          return [...prev, id];
        }
      });
    },
    [selectionMode]
  );

  const clearSelection = useCallback(() => {
    setSelectedScripts([]);
    setSelectedRecordings([]);
    setSelectionMode(false);
  }, []);

  const deleteScript = useCallback(
    async (id: string) => {
      Alert.alert(
        t("home.script.delete.title"),
        t("home.script.delete.message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              // Supprimer du contexte local
              deleteScriptFromContext(id);
            },
          },
        ]
      );
    },
    [deleteScriptFromContext, t]
  );

  const deleteSelectedItems = useCallback(async () => {
    const scriptCount = selectedScripts.length;
    const recordingCount = selectedRecordings.length;
    const totalCount = scriptCount + recordingCount;

    if (totalCount === 0) return;

    Alert.alert(
      t("home.selection.delete.title"),
      t("home.selection.delete.message", { count: totalCount }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            // Delete selected scripts using context
            if (scriptCount > 0) {
              for (const scriptId of selectedScripts) {
                deleteScriptFromContext(scriptId);
              }
            }

            // Delete selected recordings
            if (recordingCount > 0) {
              try {
                // Supprimer les fichiers physiques
                for (const recordingId of selectedRecordings) {
                  const recordingToDelete = recordings.find(
                    (r) => r.id === recordingId
                  );
                  if (recordingToDelete) {
                    // Supprimer le fichier vidéo
                    const videoUri =
                      recordingToDelete.uri || recordingToDelete.videoUri;
                    try {
                      await RNFS.unlink(videoUri);
                    } catch (error) {}

                    // Supprimer la miniature
                    if (recordingToDelete.thumbnailUri) {
                      try {
                        await RNFS.unlink(recordingToDelete.thumbnailUri);
                      } catch (error) {}
                    }
                  }
                }

                // Mettre à jour la liste
                const updatedRecordings = recordings.filter(
                  (recording) => !selectedRecordings.includes(recording.id)
                );
                setRecordings(updatedRecordings);
                await AsyncStorage.setItem(
                  "recordings",
                  JSON.stringify(updatedRecordings)
                );
              } catch (error) {
                Alert.alert(
                  t("common.error"),
                  "Impossible de supprimer certaines vidéos"
                );
              }
            }

            // Reset selection
            clearSelection();

            // Invalider le cache après suppression en masse
            await invalidateHomeCache();
          },
        },
      ]
    );
  }, [
    scripts,
    recordings,
    selectedScripts,
    selectedRecordings,
    clearSelection,
    deleteScriptFromContext,
    t,
    invalidateHomeCache,
  ]);

  const deleteRecording = useCallback(
    async (id: string) => {
      Alert.alert(
        t("home.recording.delete.title"),
        t("home.recording.delete.message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                // Trouver l'enregistrement à supprimer
                const recordingToDelete = recordings.find((r) => r.id === id);
                if (recordingToDelete) {
                  // Supprimer le fichier vidéo physique
                  const videoUri =
                    recordingToDelete.uri || recordingToDelete.videoUri;
                  try {
                    await RNFS.unlink(videoUri);
                  } catch (error) {}

                  // Supprimer la miniature si elle existe
                  if (recordingToDelete.thumbnailUri) {
                    try {
                      await RNFS.unlink(recordingToDelete.thumbnailUri);
                    } catch (error) {}
                  }
                }

                // Mettre à jour la liste des enregistrements
                const updatedRecordings = recordings.filter(
                  (recording) => recording.id !== id
                );
                setRecordings(updatedRecordings);
                await AsyncStorage.setItem(
                  "recordings",
                  JSON.stringify(updatedRecordings)
                );

                // Invalider le cache après suppression
                await invalidateHomeCache();
              } catch (error) {
                Alert.alert(
                  t("common.error"),
                  t("home.recording.delete.error") ||
                    "Impossible de supprimer la vidéo"
                );
              }
            },
          },
        ]
      );
    },
    [recordings, t, invalidateHomeCache]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when returning to the screen
  useFocusEffect(
    useCallback(() => {
      loadData();
      // Reset selection when returning to the screen
      clearSelection();
    }, [loadData, clearSelection])
  );

  const refreshData = useCallback(async (): Promise<void> => {
    // Invalider le cache avant de recharger
    await invalidateHomeCache();
    return loadData();
  }, [loadData, invalidateHomeCache]);

  return {
    scripts,
    recordings,
    deleteScript,
    deleteRecording,
    refreshData,
    selectedScripts,
    selectedRecordings,
    toggleScriptSelection,
    toggleRecordingSelection,
    clearSelection,
    deleteSelectedItems,
    isSelectionModeActive,
    toggleSelectionMode,
    selectionMode,
  };
}
