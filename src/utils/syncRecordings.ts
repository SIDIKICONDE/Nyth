import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { Recording } from "../types";
import { createLogger } from "./optimizedLogger";

const logger = createLogger("SyncRecordings");

/**
 * Synchronise les enregistrements locaux avec Firestore
 * Utile pour s'assurer que tous les enregistrements ont des métadonnées dans le cloud
 */
export const syncLocalRecordingsToFirestore = async (
  userId: string
): Promise<number> => {
  try {
    logger.info("🔄 Début de la synchronisation des enregistrements...");

    // Récupérer les enregistrements locaux
    const recordingsKey = `@recordings_${userId}`;
    const localRecordingsJson = await AsyncStorage.getItem(recordingsKey);

    if (!localRecordingsJson) {
      logger.info("Aucun enregistrement local trouvé");
      return 0;
    }

    const localRecordings: Recording[] = JSON.parse(localRecordingsJson);
    logger.info(`📹 ${localRecordings.length} enregistrements locaux trouvés`);

    let syncCount = 0;

    for (const recording of localRecordings) {
      try {
        // Vérifier si l'enregistrement existe déjà dans Firestore
        const db = getFirestore(getApp());
        const docRef = doc(collection(db, "recordings"), recording.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists) {
          // Créer les métadonnées dans Firestore
          const metadata = {
            id: recording.id,
            userId: userId,
            scriptId: recording.scriptId,
            scriptTitle: recording.scriptTitle,
            duration: recording.duration,
            localFileName: recording.id + ".mp4",
            thumbnailFileName: recording.thumbnailUri
              ? recording.id + "_thumb.jpg"
              : null,
            createdAt: recording.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(docRef, metadata);
          syncCount++;
          logger.info(`✅ Enregistrement ${recording.id} synchronisé`);
        }
      } catch (error) {
        logger.error(`❌ Erreur sync enregistrement ${recording.id}:`, error);
      }
    }

    logger.info(
      `✅ Synchronisation terminée: ${syncCount} enregistrements synchronisés`
    );
    return syncCount;
  } catch (error) {
    logger.error("❌ Erreur lors de la synchronisation:", error);
    return 0;
  }
};

/**
 * Synchronise tous les utilisateurs (admin uniquement)
 */
export const syncAllUsersRecordings = async (): Promise<void> => {
  try {
    logger.info("🔄 Synchronisation globale des enregistrements...");

    // Récupérer toutes les clés d'enregistrements dans AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const recordingKeys = allKeys.filter((key) =>
      key.startsWith("@recordings_")
    );

    logger.info(
      `📹 ${recordingKeys.length} utilisateurs avec enregistrements locaux`
    );

    for (const key of recordingKeys) {
      const userId = key.replace("@recordings_", "");
      await syncLocalRecordingsToFirestore(userId);
    }

    logger.info("✅ Synchronisation globale terminée");
  } catch (error) {
    logger.error("❌ Erreur synchronisation globale:", error);
  }
};
