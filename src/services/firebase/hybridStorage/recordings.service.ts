import RNFS from "react-native-fs";
import { Platform } from "react-native";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { Recording } from "../../../types";
import { THUMBNAIL_DIR, VIDEO_DIR } from "./constants";
import { RecordingMetadata } from "./types";
import { createLogger } from "../../../utils/optimizedLogger";

const logger = createLogger("RecordingsService");

export class RecordingsService {
  private toLocalPath(uri: string): string {
    return uri.startsWith("file://") ? uri.replace("file://", "") : uri;
  }
  async saveRecording(
    userId: string,
    videoUri: string,
    duration: number,
    scriptId?: string,
    scriptTitle?: string,
    thumbnailUri?: string
  ): Promise<string> {
    try {
      const recordingId = `rec_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const videoFileName = `${recordingId}.mp4`;
      const thumbnailFileName = thumbnailUri
        ? `${recordingId}_thumb.jpg`
        : undefined;

      const videoPath = VIDEO_DIR + videoFileName;
      const sourcePath = this.toLocalPath(videoUri);
      
      // Vérifier que le fichier source existe avant de tenter de le déplacer
      try {
        const sourceExists = await RNFS.exists(sourcePath);
        if (!sourceExists) {
          logger.error("Le fichier vidéo source n'existe pas", {
            sourcePath,
            videoUri,
          });
          throw new Error(`Le fichier vidéo n'existe pas: ${sourcePath}`);
        }
        
        // Vérifier les informations du fichier source
        const sourceInfo = await RNFS.stat(sourcePath);
        logger.info("Informations du fichier source", {
          path: sourcePath,
          size: sourceInfo.size,
          isFile: sourceInfo.isFile(),
        });
      } catch (statError) {
        logger.error("Erreur lors de la vérification du fichier source", {
          sourcePath,
          error: statError,
        });
        throw new Error(`Impossible de vérifier le fichier vidéo: ${statError.message}`);
      }
      
      // Utiliser moveFile au lieu de copyFile pour éviter la duplication
      try {
        await RNFS.moveFile(sourcePath, videoPath);
      } catch (moveError) {
        logger.error("moveFile a échoué, tentative de copyFile", {
          source: sourcePath,
          destination: videoPath,
          error: moveError,
          errorMessage: moveError.message,
          errorCode: moveError.code,
        });
        // Si moveFile échoue (ex: cross-device), utiliser copyFile
        try {
          await RNFS.copyFile(sourcePath, videoPath);
          logger.info("copyFile réussi", {
            source: sourcePath,
            destination: videoPath,
          });
        } catch (copyError) {
          logger.error("copyFile a également échoué", {
            source: sourcePath,
            destination: videoPath,
            error: copyError,
            errorMessage: copyError.message,
            errorCode: copyError.code,
          });
          
          // Sur iOS, essayer avec CameraRoll si les méthodes RNFS échouent
          if (Platform.OS === 'ios') {
            logger.info("Tentative de sauvegarde via CameraRoll pour iOS");
            try {
              const { CameraRoll } = await import('@react-native-camera-roll/camera-roll');
              const normalizedUri = videoUri.startsWith('file://') ? videoUri : `file://${videoUri}`;
              const savedUri = await CameraRoll.save(normalizedUri, { type: 'video' });
              logger.info("Vidéo sauvegardée dans CameraRoll", { savedUri });
              
              // Sur iOS, on garde la référence au fichier original dans CameraRoll
              // et on sauvegarde les métadonnées normalement
              const metadata: RecordingMetadata = {
                id: recordingId,
                userId,
                scriptId,
                scriptTitle,
                duration,
                localFileName: videoFileName,
                thumbnailFileName,
                createdAt: serverTimestamp(),
                iosPhotoLibraryUri: savedUri, // Ajouter cette référence pour iOS
              };

              const db = getFirestore(getApp());
              await setDoc(doc(collection(db, "recordings"), recordingId), metadata);
              
              return recordingId;
            } catch (cameraRollError) {
              logger.error("Échec de la sauvegarde via CameraRoll", {
                error: cameraRollError,
                errorMessage: cameraRollError.message,
              });
            }
          }
          
          throw new Error(`Impossible de sauvegarder le fichier vidéo: ${copyError.message}`);
        }
        // Supprimer l'original après la copie
        try {
          await RNFS.unlink(sourcePath);
        } catch (unlinkError) {
          logger.debug("Impossible de supprimer le fichier source", unlinkError);
        }
      }

      // 2. Sauvegarder le thumbnail localement (si fourni)
      if (thumbnailUri && thumbnailFileName) {
        const thumbnailPath = THUMBNAIL_DIR + thumbnailFileName;
        const thumbnailSource = this.toLocalPath(thumbnailUri);
        try {
          await RNFS.moveFile(thumbnailSource, thumbnailPath);
        } catch (moveError) {
          logger.warn("moveFile pour le thumbnail a échoué, tentative de copyFile", {
            source: thumbnailSource,
            destination: thumbnailPath,
            error: moveError,
          });
          await RNFS.copyFile(thumbnailSource, thumbnailPath);
          try {
            await RNFS.unlink(thumbnailSource);
          } catch (unlinkError) {
            logger.debug("Impossible de supprimer le thumbnail source", unlinkError);
          }
        }
      }

      // 3. Sauvegarder uniquement les métadonnées dans Firestore
      const metadata: RecordingMetadata = {
        id: recordingId,
        userId,
        scriptId,
        scriptTitle,
        duration,
        localFileName: videoFileName,
        thumbnailFileName,
        createdAt: serverTimestamp(),
      };

      const db = getFirestore(getApp());
      await setDoc(doc(collection(db, "recordings"), recordingId), metadata);
      
      logger.info("Enregistrement sauvegardé avec succès", {
        recordingId,
        videoPath,
        metadata,
      });

      return recordingId;
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde de l'enregistrement", {
        videoUri,
        scriptId,
        error,
      });
      throw error;
    }
  }

  async getRecordings(userId: string): Promise<Recording[]> {
    try {
      // 1. Récupérer les métadonnées depuis Firestore
      const db = getFirestore(getApp());
      const q = query(
        collection(db, "recordings"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const recordings: Recording[] = [];

      // 2. Pour chaque métadonnée, vérifier si le fichier local existe
      for (const doc of snapshot.docs) {
        const metadata = doc.data() as RecordingMetadata;
        const videoPath = VIDEO_DIR + metadata.localFileName;

        // Vérifier si la vidéo existe localement ou dans CameraRoll (iOS)
        let videoUri = videoPath;
        let videoExists = false;
        
        try {
          const videoInfo = await RNFS.stat(videoPath);
          videoExists = videoInfo.isFile();
        } catch (error) {
          // Si le fichier local n'existe pas sur iOS, vérifier CameraRoll
          if (Platform.OS === 'ios' && metadata.iosPhotoLibraryUri) {
            videoUri = metadata.iosPhotoLibraryUri;
            videoExists = true; // On assume que le fichier existe dans CameraRoll
            logger.info("Utilisation de l'URI CameraRoll pour iOS", {
              recordingId: metadata.id,
              iosUri: metadata.iosPhotoLibraryUri,
            });
          }
        }
        
        if (videoExists) {
          const thumbnailPath = metadata.thumbnailFileName
            ? THUMBNAIL_DIR + metadata.thumbnailFileName
            : undefined;

          // Gérer les différents formats de date
          let createdAt: string;

            // Si c'est un timestamp Firebase
            if (
              metadata.createdAt &&
              typeof metadata.createdAt.toDate === "function"
            ) {
              createdAt = metadata.createdAt.toDate().toISOString();
            }
            // Si c'est une chaîne ISO
            else if (
              metadata.createdAt &&
              typeof metadata.createdAt === "string"
            ) {
              createdAt = metadata.createdAt;
            }
            // Sinon, utiliser la date actuelle
            else {
              createdAt = new Date().toISOString();
            }

          recordings.push({
            id: metadata.id,
            videoUri: videoUri,
            uri: videoUri,
            thumbnailUri: thumbnailPath,
            duration: metadata.duration,
            scriptId: metadata.scriptId,
            scriptTitle: metadata.scriptTitle,
            createdAt,
          });
        }
      }

      return recordings;
    } catch (error) {
      return [];
    }
  }

  async deleteRecording(recordingId: string): Promise<void> {
    try {
      // 1. Récupérer les métadonnées
      const db = getFirestore(getApp());
      const docRef = doc(collection(db, "recordings"), recordingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists) {
        throw new Error("Enregistrement introuvable");
      }

      const metadata = docSnap.data() as RecordingMetadata;

      // 2. Supprimer les fichiers locaux
      const videoPath = VIDEO_DIR + metadata.localFileName;
      await RNFS.unlink(videoPath);

      if (metadata.thumbnailFileName) {
        const thumbnailPath = THUMBNAIL_DIR + metadata.thumbnailFileName;
        await RNFS.unlink(thumbnailPath);
      }

      // 3. Supprimer les métadonnées du cloud
      await setDoc(docRef, {}, { merge: false });
      // use deleteDoc for deletion
      const { deleteDoc } = await import("@react-native-firebase/firestore");
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }
}
