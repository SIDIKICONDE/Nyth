import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import { VideoFile } from "react-native-vision-camera";
import { createLogger } from "@/utils/optimizedLogger";
import hybridStorageService, { VIDEO_DIR } from "@/services/firebase/hybridStorageService";
import { RecordingBackupManager } from "@/services/autoSave";
import { FileManager } from "@/services/social-share/utils/fileManager";
import { Recording, Script, RecordingSettings } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toFileUri } from "@/utils/pathNormalizer";

const logger = createLogger("useRecordingSave");

interface UseRecordingSaveProps {
  script?: Script | null;
  settings?: RecordingSettings | null;
  recordingDuration: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useRecordingSave({
  script,
  settings,
  recordingDuration,
  onSaveSuccess,
  onSaveError
}: UseRecordingSaveProps) {
  const { user } = useAuth();

  const handleRecordingComplete = useCallback(async (video: VideoFile) => {
    try {
      logger.info("Enregistrement terminé - Détails du fichier vidéo", {
        videoPath: video.path,
        videoFile: video,
        duration: video.duration,
        codec: settings?.videoSettings?.codec || "h264",
      });

      // Vérifier si le fichier existe
      const { exists } = await import('react-native-fs');
      const initialFileExists = await exists(video.path);
      logger.info("Vérification de l'existence du fichier", {
        path: video.path,
        exists: initialFileExists,
      });

      await hybridStorageService.initializeLocalStorage();
      const userId = user?.uid || "guest";
      const recordingId = await hybridStorageService.saveRecording(
        userId,
        video.path,
        recordingDuration,
        script?.id,
        script?.title
      );

      // Le chemin final de la vidéo après déplacement par hybridStorageService
      const savedVideoPath = `${VIDEO_DIR}${recordingId}.mp4`;
      logger.info("Chemin de sauvegarde calculé", {
        VIDEO_DIR,
        recordingId,
        savedVideoPath
      });

      // Vérifier que le fichier existe bien à cet emplacement
      const RNFS = require("react-native-fs");
      const savedFileExists = await RNFS.exists(savedVideoPath);

      // Sur iOS, obtenir plus d'informations sur le fichier
      let fileInfo = null;
      if (savedFileExists) {
        try {
          fileInfo = await RNFS.stat(savedVideoPath);
          logger.info("Informations du fichier sur iOS", {
            path: fileInfo.path,
            size: fileInfo.size,
            isFile: fileInfo.isFile(),
            ctime: fileInfo.ctime,
            mtime: fileInfo.mtime
          });
        } catch (statError) {
          logger.error("Erreur lors de stat() du fichier", statError);
        }
      }

      logger.info("Vérification de l'existence du fichier", {
        savedVideoPath,
        fileExists: savedFileExists,
        platform: Platform.OS,
        fileInfo: fileInfo ? { size: fileInfo.size, isFile: fileInfo.isFile() } : null
      });

      // Utiliser la fonction centralisée pour créer l'URI
      const videoUriWithPrefix = toFileUri(savedVideoPath);

      // Créer l'objet Recording avec le chemin final correct
      const newRecording: Recording = {
        id: recordingId,
        videoUri: videoUriWithPrefix,
        uri: videoUriWithPrefix,
        duration: recordingDuration,
        scriptId: script?.id,
        scriptTitle: script?.title,
        createdAt: new Date().toISOString(),
        quality: settings?.quality || "high",
      };

      if (settings?.videoSettings) {
        (newRecording as any).videoSettings = {
          codec: settings.videoSettings.codec || "h264",
          stabilization:
            settings.videoSettings.stabilization || "auto",
        };
      }

      // Sauvegarder dans AsyncStorage
      await RecordingBackupManager.saveRecording(newRecording);
      logger.info("Enregistrement sauvegardé dans AsyncStorage", {
        recordingId,
        videoUri: videoUriWithPrefix,
      });

      // Sauvegarder directement dans la galerie
      logger.info("Tentative de sauvegarde dans la galerie", {
        videoUri: videoUriWithPrefix,
        savedVideoPath,
        fileExists: savedFileExists
      });

      let savedToGallery = false;
      try {
        savedToGallery = await FileManager.saveToGallery(videoUriWithPrefix);
        logger.info("Résultat de la sauvegarde dans la galerie", { savedToGallery });
      } catch (galleryError) {
        logger.error("Erreur lors de la sauvegarde dans la galerie", galleryError);
        savedToGallery = false;
      }

      if (savedToGallery) {
        logger.info("Vidéo sauvegardée dans la galerie avec succès");
        onSaveSuccess?.();
      } else {
        logger.error("Échec de la sauvegarde dans la galerie");
        // Ne pas bloquer la navigation: le fichier est déjà sauvegardé localement
        Alert.alert(
          "Galerie non disponible",
          "La vidéo a été sauvegardée localement. Vous pourrez réessayer l'export vers la galerie depuis votre bibliothèque.",
          [
            { text: "OK", onPress: () => onSaveSuccess?.() },
            {
              text: "Réessayer",
              onPress: async () => {
                await FileManager.saveToGallery(videoUriWithPrefix);
                onSaveSuccess?.();
              },
            },
          ]
        );
      }
    } catch (e) {
      logger.error(
        "Erreur lors de la sauvegarde de l'enregistrement",
        e
      );
      const errorWithCatch = e instanceof Error ? e : new Error("Erreur inconnue");
      const fallbackId = `rec_${Date.now()}`;

      // Utiliser la fonction centralisée pour créer l'URI de fallback
      const fallbackVideoUri = toFileUri(video.path);

      const fallbackRecording: Recording = {
        id: fallbackId,
        videoUri: fallbackVideoUri,
        uri: fallbackVideoUri,
        duration: recordingDuration,
        scriptId: script?.id,
        scriptTitle: script?.title,
        createdAt: new Date().toISOString(),
        quality: settings?.quality || "high",
      };

      if (settings?.videoSettings) {
        (fallbackRecording as any).videoSettings = {
          codec: settings.videoSettings.codec || "h264",
          stabilization:
            settings.videoSettings.stabilization || "auto",
        };
      }

      try {
        await RecordingBackupManager.saveRecording(fallbackRecording);
        logger.info("Enregistrement de secours sauvegardé", {
          fallbackId,
        });

        // Essayer de sauvegarder dans la galerie même en cas d'erreur
        const savedToGallery = await FileManager.saveToGallery(fallbackVideoUri);
        if (savedToGallery) {
          onSaveSuccess?.();
        } else {
          Alert.alert(
            "Erreur",
            "L'enregistrement a été sauvegardé localement mais n'a pas pu être exporté dans la galerie.",
            [{ text: "OK", onPress: () => onSaveSuccess?.() }]
          );
        }
      } catch (backupError) {
        logger.error(
          "Erreur lors de la sauvegarde de secours",
          backupError
        );
        onSaveError?.(backupError instanceof Error ? backupError : new Error("Erreur de sauvegarde"));
      }
    }
  }, [script, settings, recordingDuration, user, onSaveSuccess, onSaveError]);

  return {
    handleRecordingComplete,
  };
}
