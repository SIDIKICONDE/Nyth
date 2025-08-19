import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "@/utils/optimizedLogger";
import { useTranslation } from "@/hooks/useTranslation";

const logger = createLogger("useEmergencyRecordingSave");

interface EmergencyRecordingData {
  id: string;
  timestamp: number;
  scriptTitle: string;
  recordingDuration: number;
  videoPath?: string;
  audioPath?: string;
  metadata: {
    reason: "memory_critical" | "system_error" | "manual_stop";
    memoryUsage?: number;
    qualityReduced?: boolean;
    partialSave: boolean;
  };
}

interface EmergencyRecordingOptions {
  onSaveStarted?: () => void;
  onSaveCompleted?: (savedData: EmergencyRecordingData) => void;
  onSaveFailed?: (error: Error) => void;
  // Fournir une manière d'arrêter l'enregistrement actif et de récupérer le chemin
  // Implémentation côté appelant: doit retourner le chemin absolu du fichier ou null
  stopActiveRecordingAndGetPath?: () => Promise<string | null>;
}

export function useEmergencyRecordingSave(
  options: EmergencyRecordingOptions = {}
) {
  const { t } = useTranslation();
  const { onSaveStarted, onSaveCompleted, onSaveFailed, stopActiveRecordingAndGetPath } = options;

  const savingInProgressRef = useRef(false);
  const lastSaveAttemptRef = useRef<number>(0);

  // Sauvegarder d'urgence l'enregistrement en cours
  const performEmergencySave = useCallback(
    async (
      scriptTitle: string,
      recordingDuration: number,
      memoryUsage?: number,
      reason:
        | "memory_critical"
        | "system_error"
        | "manual_stop" = "memory_critical"
    ): Promise<EmergencyRecordingData | null> => {
      // Éviter les sauvegardes multiples simultanées
      if (savingInProgressRef.current) {
        logger.warn("Sauvegarde d'urgence déjà en cours, ignorée");
        return null;
      }

      // Éviter les sauvegardes trop fréquentes (minimum 5 secondes d'intervalle)
      const now = Date.now();
      if (now - lastSaveAttemptRef.current < 5000) {
        logger.warn("Sauvegarde d'urgence trop fréquente, ignorée");
        return null;
      }

      savingInProgressRef.current = true;
      lastSaveAttemptRef.current = now;
      onSaveStarted?.();

      logger.info("Démarrage sauvegarde d'urgence", {
        scriptTitle,
        recordingDuration,
        memoryUsage,
        reason,
      });

      try {
        // Générer un ID unique pour cette sauvegarde d'urgence
        const emergencyId = `emergency_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Préparer les données de sauvegarde
        const emergencyData: EmergencyRecordingData = {
          id: emergencyId,
          timestamp: now,
          scriptTitle,
          recordingDuration,
          metadata: {
            reason,
            memoryUsage,
            partialSave: true,
          },
        };

        // 1. Arrêter l'enregistrement en cours et récupérer le fichier
        logger.info("Arrêt d'urgence de l'enregistrement en cours...");
        const savedVideoPath =
          (await stopActiveRecordingAndGetPath?.()) ?? (await stopRecordingAndGetPath());

        if (savedVideoPath) {
          emergencyData.videoPath = savedVideoPath;
          logger.info("Fichier vidéo sauvegardé:", savedVideoPath);
        }

        // 2. Sauvegarder les métadonnées dans AsyncStorage
        await saveEmergencyMetadata(emergencyData);

        // 3. Ajouter à la liste des enregistrements d'urgence
        await addToEmergencyList(emergencyData);

        // 4. Créer un fichier de récupération pour la session
        await createRecoveryFile(emergencyData);

        logger.info("Sauvegarde d'urgence terminée avec succès", emergencyData);
        onSaveCompleted?.(emergencyData);

        // Afficher une notification à l'utilisateur
        showEmergencySaveNotification(emergencyData);

        return emergencyData;
      } catch (error) {
        logger.error("Erreur lors de la sauvegarde d'urgence", error);
        onSaveFailed?.(error as Error);

        // Afficher une alerte d'erreur
        Alert.alert(
          t("recording.emergency.save_failed.title", "Erreur de Sauvegarde"),
          t(
            "recording.emergency.save_failed.message",
            "Impossible de sauvegarder l'enregistrement. Les données pourraient être perdues."
          ),
          [{ text: "OK", style: "default" }]
        );

        return null;
      } finally {
        savingInProgressRef.current = false;
      }
    },
    [t, onSaveStarted, onSaveCompleted, onSaveFailed]
  );

  // Arrêter l'enregistrement et récupérer le chemin du fichier
  const stopRecordingAndGetPath = useCallback(async (): Promise<string | null> => {
    try {
      // Fallback si aucun service n'est fourni par l'appelant
      logger.warn("Aucun service d'arrêt fourni. Impossible de récupérer le fichier en cours.");
      return null;
    } catch (error) {
      logger.error("Erreur lors de l'arrêt d'urgence de l'enregistrement", error);
      return null;
    }
  }, []);

  // Sauvegarder les métadonnées d'urgence
  const saveEmergencyMetadata = useCallback(
    async (data: EmergencyRecordingData) => {
      const key = `emergency_recording_${data.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      logger.debug("Métadonnées d'urgence sauvegardées:", key);
    },
    []
  );

  // Ajouter à la liste des enregistrements d'urgence
  const addToEmergencyList = useCallback(
    async (data: EmergencyRecordingData) => {
      try {
        const existingListStr = await AsyncStorage.getItem(
          "emergency_recordings_list"
        );
        const existingList: string[] = existingListStr
          ? JSON.parse(existingListStr)
          : [];

        existingList.unshift(data.id); // Ajouter au début (plus récent)

        // Garder seulement les 10 derniers enregistrements d'urgence
        if (existingList.length > 10) {
          const removedIds = existingList.splice(10);
          // Nettoyer les anciennes données
          for (const oldId of removedIds) {
            await AsyncStorage.removeItem(`emergency_recording_${oldId}`);
          }
        }

        await AsyncStorage.setItem(
          "emergency_recordings_list",
          JSON.stringify(existingList)
        );
        logger.debug("Liste des enregistrements d'urgence mise à jour");
      } catch (error) {
        logger.error("Erreur mise à jour liste d'urgence", error);
      }
    },
    []
  );

  // Créer un fichier de récupération pour la session
  const createRecoveryFile = useCallback(
    async (data: EmergencyRecordingData) => {
      try {
        const recoveryData = {
          ...data,
          sessionId: await AsyncStorage.getItem("current_session_id"),
          appVersion: "1.0.0", // TODO: Récupérer la vraie version
          deviceInfo: {
            platform: "ios", // TODO: Récupérer la vraie plateforme
            timestamp: Date.now(),
          },
        };

        await AsyncStorage.setItem(
          "last_emergency_recovery",
          JSON.stringify(recoveryData)
        );
        logger.debug("Fichier de récupération créé");
      } catch (error) {
        logger.error("Erreur création fichier de récupération", error);
      }
    },
    []
  );

  // Afficher une notification de sauvegarde d'urgence
  const showEmergencySaveNotification = useCallback(
    (data: EmergencyRecordingData) => {
      const durationStr = formatDuration(data.recordingDuration);

      Alert.alert(
        t("recording.emergency.saved.title", "Enregistrement Sauvegardé"),
        t(
          "recording.emergency.saved.message",
          `Votre enregistrement de ${durationStr} a été sauvegardé automatiquement avant l'arrêt d'urgence. Vous pourrez le récupérer depuis l'écran de récupération.`
        ),
        [
          {
            text: t("recording.emergency.saved.view_later", "Voir Plus Tard"),
            style: "default",
          },
          {
            text: t(
              "recording.emergency.saved.recover_now",
              "Récupérer Maintenant"
            ),
            style: "default",
            onPress: () => {
              // TODO: Naviguer vers l'écran de récupération
              logger.info("Navigation vers écran de récupération demandée");
            },
          },
        ]
      );
    },
    [t]
  );

  // Récupérer la liste des enregistrements d'urgence
  const getEmergencyRecordings = useCallback(async (): Promise<
    EmergencyRecordingData[]
  > => {
    try {
      const listStr = await AsyncStorage.getItem("emergency_recordings_list");
      if (!listStr) return [];

      const ids: string[] = JSON.parse(listStr);
      const recordings: EmergencyRecordingData[] = [];

      for (const id of ids) {
        try {
          const dataStr = await AsyncStorage.getItem(
            `emergency_recording_${id}`
          );
          if (dataStr) {
            recordings.push(JSON.parse(dataStr));
          }
        } catch (error) {
          logger.warn(
            `Erreur chargement enregistrement d'urgence ${id}`,
            error
          );
        }
      }

      return recordings.sort((a, b) => b.timestamp - a.timestamp); // Plus récent en premier
    } catch (error) {
      logger.error("Erreur récupération liste d'urgence", error);
      return [];
    }
  }, []);

  // Supprimer un enregistrement d'urgence
  const deleteEmergencyRecording = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        // Supprimer les métadonnées
        await AsyncStorage.removeItem(`emergency_recording_${id}`);

        // Mettre à jour la liste
        const listStr = await AsyncStorage.getItem("emergency_recordings_list");
        if (listStr) {
          const ids: string[] = JSON.parse(listStr);
          const updatedIds = ids.filter((existingId) => existingId !== id);
          await AsyncStorage.setItem(
            "emergency_recordings_list",
            JSON.stringify(updatedIds)
          );
        }

        logger.info("Enregistrement d'urgence supprimé:", id);
        return true;
      } catch (error) {
        logger.error("Erreur suppression enregistrement d'urgence", error);
        return false;
      }
    },
    []
  );

  // Vérifier s'il y a des enregistrements à récupérer au démarrage
  const checkForRecoveryData =
    useCallback(async (): Promise<EmergencyRecordingData | null> => {
      try {
        const recoveryStr = await AsyncStorage.getItem(
          "last_emergency_recovery"
        );
        if (recoveryStr) {
          const recoveryData = JSON.parse(recoveryStr);

          // Vérifier si la récupération n'est pas trop ancienne (24h max)
          const isRecent =
            Date.now() - recoveryData.timestamp < 24 * 60 * 60 * 1000;

          if (isRecent) {
            logger.info("Données de récupération trouvées", {
              id: recoveryData.id,
              age: Date.now() - recoveryData.timestamp,
            });
            return recoveryData;
          } else {
            // Nettoyer les anciennes données
            await AsyncStorage.removeItem("last_emergency_recovery");
          }
        }
        return null;
      } catch (error) {
        logger.error("Erreur vérification données de récupération", error);
        return null;
      }
    }, []);

  // Utilitaire pour formater la durée
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    // Actions principales
    performEmergencySave,

    // Gestion des enregistrements d'urgence
    getEmergencyRecordings,
    deleteEmergencyRecording,

    // Récupération au démarrage
    checkForRecoveryData,

    // État
    isSaving: savingInProgressRef.current,

    // Utilitaires
    formatDuration,
  };
}
