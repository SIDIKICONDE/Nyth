/**
 * Configuration Firebase
 */

import { getApp } from '@react-native-firebase/app';
import { httpsCallable } from '@react-native-firebase/functions';
import { getFirestore, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getStorage, FirebaseStorageTypes } from '@react-native-firebase/storage';
import { createOptimizedLogger } from '../utils/optimizedLogger';

const logger = createOptimizedLogger('FirebaseConfig');

// Configuration des fonctions Firebase
export const functions = {
  httpsCallable,
};

export const getFirebaseApp = () => getApp();

// Instances Firebase avec types appropriés
export let db: FirebaseFirestoreTypes.Module | null = null;
export let storage: FirebaseStorageTypes.Module | null = null;

/**
 * Initialise Firebase et vérifie que tout fonctionne
 */
export const initializeFirebase = async (): Promise<boolean> => {
  try {
    logger.debug('Initialisation de Firebase...');
    
    // Vérifier que l'app Firebase est disponible
    const app = getApp();
    if (!app) {
      logger.error('Application Firebase non trouvée');
      return false;
    }

    logger.debug('✅ Firebase initialisé avec succès');
    return true;
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation Firebase:', error);
    return false;
  }
};

/**
 * Configure les services Firebase (Firestore, Storage, etc.)
 */
export const setupFirebaseServices = (): void => {
  try {
    logger.debug('Configuration des services Firebase...');
    
    // Initialiser Firestore
    db = getFirestore();
    
    // Initialiser Storage
    storage = getStorage();
    
    logger.debug('✅ Services Firebase configurés');
  } catch (error) {
    logger.error('❌ Erreur lors de la configuration des services Firebase:', error);
  }
};