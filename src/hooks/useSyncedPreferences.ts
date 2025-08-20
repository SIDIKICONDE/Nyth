import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import userPreferencesService, { UserPreferences } from '../services/firebase/userPreferencesService';
import { createLogger } from '../utils/optimizedLogger';

const logger = createLogger('useSyncedPreferences');

export const useSyncedPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences au démarrage
  useEffect(() => {
    if (user && !user.isGuest) {
      loadPreferences();
    } else {
      // Pour les invités, charger depuis AsyncStorage uniquement
      loadLocalPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user || user.isGuest) return;

    try {
      setIsLoading(true);
      
      // 1. Essayer de charger depuis Firestore
      const cloudPrefs = await userPreferencesService.getPreferences(user.uid);
      
      if (cloudPrefs) {
        // Utiliser les préférences du cloud
        setPreferences(cloudPrefs);
        
        // Synchroniser avec AsyncStorage
        await AsyncStorage.setItem('@user_preferences', JSON.stringify(cloudPrefs));
        logger.info('✅ Préférences chargées depuis le cloud');
      } else {
        // 2. Si pas de préférences cloud, charger depuis AsyncStorage
        const localPrefs = await loadLocalPreferences();
        
        // 3. Sauvegarder dans le cloud pour la prochaine fois
        if (localPrefs && Object.keys(localPrefs).length > 0) {
          await userPreferencesService.savePreferences(user.uid, localPrefs);
          logger.info('✅ Préférences locales synchronisées vers le cloud');
        }
      }
    } catch (error) {
      logger.error('❌ Erreur lors du chargement des préférences:', error);
      // En cas d'erreur, utiliser les préférences locales
      await loadLocalPreferences();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalPreferences = async (): Promise<UserPreferences> => {
    try {
      const stored = await AsyncStorage.getItem('@user_preferences');
      const localPrefs = stored ? JSON.parse(stored) : {};
      setPreferences(localPrefs);
      return localPrefs;
    } catch (error) {
      logger.error('❌ Erreur lors du chargement des préférences locales:', error);
      return {};
    }
  };

  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    try {
      // Mettre à jour localement
      const newPrefs = { ...preferences, [key]: value };
      setPreferences(newPrefs);
      await AsyncStorage.setItem('@user_preferences', JSON.stringify(newPrefs));
      
      // Synchroniser avec le cloud si connecté
      if (user && !user.isGuest) {
        await userPreferencesService.updatePreference(user.uid, key, value);
        logger.info(`✅ Préférence ${key} synchronisée`);
      }
    } catch (error) {
      logger.error(`❌ Erreur lors de la mise à jour de ${key}:`, error);
    }
  }, [user, preferences]);

  const resetPreferences = useCallback(async () => {
    try {
      const defaultPrefs: UserPreferences = {};
      setPreferences(defaultPrefs);
      
      // Réinitialiser localement
      await AsyncStorage.removeItem('@user_preferences');
      
      // Réinitialiser dans le cloud si connecté
      if (user && !user.isGuest) {
        await userPreferencesService.savePreferences(user.uid, defaultPrefs);
      }
      
      logger.info('✅ Préférences réinitialisées');
    } catch (error) {
      logger.error('❌ Erreur lors de la réinitialisation:', error);
    }
  }, [user]);

  return {
    preferences,
    updatePreference,
    resetPreferences,
    isLoading
  };
}; 