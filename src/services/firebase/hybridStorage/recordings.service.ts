import RNFS from "react-native-fs";
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
      
      // Utiliser moveFile au lieu de copyFile pour éviter la duplication
      try {
        await RNFS.moveFile(sourcePath, videoPath);
      } catch (moveError) {
        logger.error("moveFile a échoué, tentative de copyFile", {
          source: sourcePath,
          destination: videoPath,
          error: moveError,
        });
        // Si moveFile échoue (ex: cross-device), utiliser copyFile
        try {
          await RNFS.copyFile(sourcePath, videoPath);
        } catch (copyError) {
          logger.error("copyFile a également échoué", {
            source: sourcePath,
            destination: videoPath,
            error: copyError,
          });
          throw new Error("Impossible de sauvegarder le fichier vidéo.");
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

        // Vérifier si la vidéo existe localement
        try {
          const videoInfo = await RNFS.stat(videoPath);
          if (videoInfo.isFile()) {
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
              videoUri: videoPath,
              uri: videoPath,
              thumbnailUri: thumbnailPath,
              duration: metadata.duration,
              scriptId: metadata.scriptId,
              scriptTitle: metadata.scriptTitle,
              createdAt,
            });
          }
        } catch (error) {}
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
