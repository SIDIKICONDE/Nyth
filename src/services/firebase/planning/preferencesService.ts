import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  getDoc,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../../utils/optimizedLogger";
import { PlanningPreferences } from "./types";

const logger = createLogger("PreferencesService");

export class PreferencesService {
  /**
   * Sauvegarder les préférences de planification
   */
  async savePlanningPreferences(
    preferences: PlanningPreferences
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const prefRef = doc(
        collection(db, "planningPreferences"),
        preferences.userId
      );
      await updateDoc(prefRef, {
        ...preferences,
        updatedAt: new Date().toISOString(),
      });

      logger.info("Préférences sauvegardées", { userId: preferences.userId });
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde des préférences:", error);
      throw error;
    }
  }

  /**
   * Récupérer les préférences de planification
   */
  async getPlanningPreferences(
    userId: string
  ): Promise<PlanningPreferences | null> {
    try {
      const db = getFirestore(getApp());
      const prefDoc = await getDoc(
        doc(collection(db, "planningPreferences"), userId)
      );

      if (prefDoc.exists()) {
        return prefDoc.data() as PlanningPreferences;
      }

      return null;
    } catch (error) {
      logger.error("Erreur lors de la récupération des préférences:", error);
      throw error;
    }
  }
}

export const preferencesService = new PreferencesService();
