// @ts-nocheck
//  import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../utils/optimizedLogger";

// Import React Native Firebase (API modulaire)
import { getApp, getApps, initializeApp } from "@react-native-firebase/app";
import {
  getFirestore,
  type FirebaseFirestore,
} from "@react-native-firebase/firestore";
import {
  getStorage,
  type FirebaseStorage,
} from "@react-native-firebase/storage";
import {
  getFunctions,
  type FirebaseFunctions,
} from "@react-native-firebase/functions";

const logger = createLogger("Firebase");

try {
  if (getApps().length === 0) {
    initializeApp();
  }
} catch (_e) {}

let firebaseInitialized = false;

// Vérification que Firebase est bien configuré
const initializeFirebase = async () => {
  if (firebaseInitialized) {
    logger.info("Firebase déjà initialisé.");
    return true;
  }

  try {
    // API modulaire: utiliser getApps/getApp et initializeApp
    if (getApps().length === 0) {
      logger.info("Initialisation de Firebase (modulaire)...");
      await initializeApp();
      logger.info("✅ Firebase initialisé avec succès.");
    } else {
      logger.info("✅ Firebase était déjà initialisé.");
    }

    const firebaseApp = getApp();
    logger.info(
      "✅ Firebase configuré avec le projet:",
      firebaseApp.options.projectId
    );
    firebaseInitialized = true;
    return true;
  } catch (error) {
    logger.error("❌ Erreur d'initialisation Firebase:", error);
    logger.warn(
      "⚠️ Firebase non disponible, certaines fonctionnalités seront désactivées"
    );
    firebaseInitialized = false;
    return false;
  }
};

// Services Firebase avec gestion d'erreur
let db: FirebaseFirestore | undefined,
  storageService: FirebaseStorage | undefined,
  functionsService: FirebaseFunctions | undefined;

const setupFirebaseServices = () => {
  if (firebaseInitialized) {
    try {
      const app = getApp();
      db = getFirestore(app);
      storageService = getStorage(app);
      functionsService = getFunctions(app);
      logger.info("✅ Services Firebase initialisés (API modulaire)");
    } catch (error) {
      logger.error(
        "❌ Erreur lors de l'initialisation des services Firebase:",
        error
      );
    }
  } else {
    logger.warn(
      "⚠️ Services Firebase non disponibles, initialisation échouée."
    );
  }
};

// Configuration pour réduire les warnings de connexion
if (__DEV__) {
  logger.info("📱 Mode développement - Firebase prêt");
}

export {
  db,
  storageService as storage,
  functionsService as functions,
  initializeFirebase,
  setupFirebaseServices,
  firebaseInitialized,
};
// Aucun export par défaut pour éviter l'utilisation de l'API namespacée
