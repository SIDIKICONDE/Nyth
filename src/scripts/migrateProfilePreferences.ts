import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "@react-native-firebase/firestore";
import { DEFAULT_PROFILE_DISPLAY_PREFERENCES } from "../types/user";

export async function migrateProfilePreferences() {
  try {
    // Récupérer tous les utilisateurs
    const db = getFirestore(getApp());
    const usersSnapshot = await getDocs(collection(db, "users"));

    let migratedCount = 0;
    let skippedCount = 0;

    // Parcourir chaque utilisateur
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      // Si l'utilisateur n'a pas de profilePreferences, les ajouter
      if (!userData.profilePreferences) {
        const userRef = doc(collection(db, "users"), userDoc.id);
        await updateDoc(userRef, {
          profilePreferences: DEFAULT_PROFILE_DISPLAY_PREFERENCES,
          updatedAt: new Date().toISOString(),
        });

        migratedCount++;
      } else {
        skippedCount++;
      }
    }
  } catch (error) {
    throw error;
  }
}

// Pour exécuter la migration, décommentez la ligne suivante:
// migrateProfilePreferences();
