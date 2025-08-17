import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "./types";

/**
 * Clés AsyncStorage utilisées pour l'authentification
 */
export const STORAGE_KEYS = {
  CURRENT_USER: "@current_user",
  FIREBASE_SESSION: "@firebase_session",
  AUTH_STATE_CHANGED: "@auth_state_changed",
  USER_LANGUAGE: "userLanguage",
} as const;

/**
 * Génère une clé de stockage spécifique à un utilisateur
 */
export const getUserStorageKey = (uid: string, key: string): string => {
  return `${key}_${uid}`;
};

/**
 * Sauvegarde un utilisateur dans AsyncStorage
 */
export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    // Sauvegarder le nom et l'email séparément pour l'IA
    if (user.name) {
      await AsyncStorage.setItem(
        getUserStorageKey(user.uid, "userName"),
        user.name
      );
    }
    if (user.email) {
      await AsyncStorage.setItem(
        getUserStorageKey(user.uid, "userEmail"),
        user.email
      );
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Récupère l'utilisateur sauvegardé depuis AsyncStorage
 */
export const getSavedUser = async (): Promise<User | null> => {
  try {
    const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Marque la session Firebase comme active
 */
export const setFirebaseSession = async (active: boolean): Promise<void> => {
  try {
    if (active) {
      await AsyncStorage.setItem(STORAGE_KEYS.FIREBASE_SESSION, "active");
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.FIREBASE_SESSION);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Nettoie toutes les données d'authentification
 */
export const clearAuthStorage = async (uid?: string): Promise<void> => {
  try {
    const keysToRemove: string[] = [
      STORAGE_KEYS.CURRENT_USER,
      STORAGE_KEYS.FIREBASE_SESSION,
    ];

    // Ajouter les clés spécifiques à l'utilisateur si uid est fourni
    if (uid) {
      keysToRemove.push(
        getUserStorageKey(uid, "userName"),
        getUserStorageKey(uid, "userEmail")
      );
    }

    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
    throw error;
  }
};

/**
 * Notifie un changement d'état d'authentification
 */
export const notifyAuthStateChange = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.AUTH_STATE_CHANGED,
      Date.now().toString()
    );
  } catch (error) {}
};
