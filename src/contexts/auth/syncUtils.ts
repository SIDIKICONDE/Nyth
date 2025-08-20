import { UserRole } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Alert } from "react-native";

// Types pour les données Firestore
interface ScriptData {
  id: string;
  [key: string]: unknown;
}

interface RecordingData {
  id: string;
  videoUri: string | null;
  isCloudOnly: boolean;
  [key: string]: unknown;
}

/**
 * Récupère les données de Firebase (scripts, enregistrements, paramètres, statistiques)
 * et les stocke localement dans AsyncStorage.
 */
export const syncFirebaseDataToLocal = async (
  firebaseUserId: string
): Promise<void> => {
  try {
    /* ---------------------- 1. Scripts ---------------------- */
    try {
      const db = getFirestore(getApp());
      const scriptsSnapshot = await getDocs(
        query(collection(db, "scripts"), where("userId", "==", firebaseUserId))
      );

      if (!scriptsSnapshot.empty) {
        const scripts = scriptsSnapshot.docs.map(
          (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
            id: d.id,
            ...d.data(),
          })
        ) as ScriptData[];
        await AsyncStorage.setItem(
          `@scripts_${firebaseUserId}`,
          JSON.stringify(scripts)
        );
      }
    } catch (err) {}

    /* ------------------- 2. Enregistrements ------------------ */
    try {
      const recordingsSnapshot = await getDocs(
        query(
          collection(getFirestore(getApp()), "recordings"),
          where("userId", "==", firebaseUserId)
        )
      );

      if (!recordingsSnapshot.empty) {
        const recordings = recordingsSnapshot.docs.map(
          (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
            id: d.id,
            ...d.data(),
            videoUri: null, // la vidéo n'est pas stockée localement
            isCloudOnly: true,
          })
        ) as RecordingData[];

        // Fusionner avec les enregistrements locaux existants
        const existingStr = await AsyncStorage.getItem(
          `@recordings_${firebaseUserId}`
        );
        const existing = existingStr ? JSON.parse(existingStr) : [];
        const merged = [...existing];
        recordings.forEach((cloud) => {
          if (!merged.find((r) => r.id === cloud.id)) {
            merged.push(cloud);
          }
        });
        await AsyncStorage.setItem(
          `@recordings_${firebaseUserId}`,
          JSON.stringify(merged)
        );
      }
    } catch (err) {}

    /* ---------------------- 3. Paramètres -------------------- */
    try {
      const settingsSnap = await getDocs(
        collection(getFirestore(getApp()), "users", firebaseUserId, "settings")
      );
      for (const d of settingsSnap.docs) {
        const localKey = `@${d.id.replace(/([A-Z])/g, "_$1").toLowerCase()}`;
        if (d.data().data) {
          await AsyncStorage.setItem(localKey, JSON.stringify(d.data().data));
        }
      }
    } catch (err) {}

    /* --------------------- 4. Statistiques ------------------- */
    try {
      const userDoc = await getDoc(
        doc(getFirestore(getApp()), "users", firebaseUserId)
      );
      if (userDoc.exists() && userDoc.data()?.stats) {
        await AsyncStorage.setItem(
          `@stats_${firebaseUserId}`,
          JSON.stringify(userDoc.data()?.stats)
        );
      }
    } catch (err) {}
  } catch (error) {}
};

export const syncLocalDataToFirebase = async (
  localUserId: string,
  firebaseUserId: string
): Promise<void> => {
  try {
    /* ---------------------- 1. Scripts ----------------------- */
    const localScriptsKey = `@scripts_${localUserId}`;
    const localScripts = await AsyncStorage.getItem(localScriptsKey);
    if (localScripts) {
      const scripts = JSON.parse(localScripts);

      for (const script of scripts) {
        try {
          const db = getFirestore(getApp());
          await setDoc(doc(collection(db, "scripts"), script.id), {
            ...script,
            userId: firebaseUserId,
            syncedAt: new Date().toISOString(),
          });
        } catch (err) {}
      }

      await AsyncStorage.setItem(`@scripts_${firebaseUserId}`, localScripts);
      if (localUserId !== firebaseUserId)
        await AsyncStorage.removeItem(localScriptsKey);
    }

    /* ------------------- 2. Enregistrements ------------------ */
    const localRecordingsKey = `@recordings_${localUserId}`;
    const localRecordings = await AsyncStorage.getItem(localRecordingsKey);
    if (localRecordings) {
      const recordings = JSON.parse(localRecordings);

      for (const rec of recordings) {
        try {
          const { videoUri, ...metadata } = rec;
          const db = getFirestore(getApp());
          await setDoc(doc(collection(db, "recordings"), rec.id), {
            ...metadata,
            userId: firebaseUserId,
            syncedAt: new Date().toISOString(),
            hasLocalVideo: !!videoUri,
          });
        } catch (err) {}
      }

      await AsyncStorage.setItem(
        `@recordings_${firebaseUserId}`,
        localRecordings
      );
      if (localUserId !== firebaseUserId)
        await AsyncStorage.removeItem(localRecordingsKey);
    }

    /* ---------------- 3. Préférences / paramètres ------------- */
    const settingsKeys = [
      "@recording_settings",
      "@theme_settings",
      "@language_preference",
      "@display_preferences",
      "@ai_settings",

    ];

    for (const key of settingsKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (!value) continue;

        const settingName = key.replace("@", "").replace(/_/g, "");
        const db = getFirestore(getApp());
        await setDoc(
          doc(collection(db, "users", firebaseUserId, "settings"), settingName),
          {
            data: JSON.parse(value),
            updatedAt: new Date().toISOString(),
          }
        );
      } catch (err) {}
    }

    /* ---------------------- 4. Statistiques ------------------ */
    const statsKey = `@stats_${localUserId}`;
    const localStats = await AsyncStorage.getItem(statsKey);
    if (localStats) {
      try {
        const db = getFirestore(getApp());
        await setDoc(
          doc(collection(db, "users"), firebaseUserId),
          {
            stats: JSON.parse(localStats),
            statsUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        await AsyncStorage.setItem(`@stats_${firebaseUserId}`, localStats);
        if (localUserId !== firebaseUserId)
          await AsyncStorage.removeItem(statsKey);
      } catch (err) {}
    }
  } catch (error) {
    Alert.alert(
      "Erreur de synchronisation",
      "Certaines données n'ont pas pu être synchronisées. Elles seront synchronisées lors de votre prochaine connexion.",
      [{ text: "OK" }]
    );
  }
};

/**
 * Crée le document profil utilisateur dans Firestore après l'inscription.
 */
export const createUserProfile = async (
  uid: string,
  email: string,
  name: string
): Promise<void> => {
  try {
    const now = new Date().toISOString();

    const db = getFirestore(getApp());
    await setDoc(doc(collection(db, "users"), uid), {
      email,
      name,
      displayName: name,
      photoURL: null,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });
  } catch (err) {}
};
