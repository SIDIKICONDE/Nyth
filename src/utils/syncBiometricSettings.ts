/**
 * Utilitaire pour synchroniser et déboguer les paramètres biométriques
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from './optimizedLogger';

const logger = createLogger('SyncBiometricSettings');

export const syncAndDebugBiometricSettings = async () => {
  logger.info('=== Synchronisation des paramètres biométriques ===');
  
  try {
    // Lire les paramètres actuels
    const settings = await AsyncStorage.getItem('biometric_settings');
    logger.info('Paramètres actuels:', settings ? JSON.parse(settings) : 'Aucun');
    
    if (!settings) {
      logger.warn('Aucun paramètre trouvé, création des paramètres par défaut');
      const defaultSettings = {
        enabled: false,
        requireForSave: false,
        requireForAccess: false,
        requiredForSettings: false,
        authValidityMinutes: 5
      };
      await AsyncStorage.setItem('biometric_settings', JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    
    const parsed = JSON.parse(settings);
    
    // Vérifier la cohérence des propriétés
    logger.info('État des propriétés:');
    logger.info('- enabled:', parsed.enabled);
    logger.info('- requireForSave:', parsed.requireForSave);
    logger.info('- requireForAccess:', parsed.requireForAccess);
    logger.info('- requiredForSettings:', parsed.requiredForSettings);
    logger.info('- requiredForApiKeys:', parsed.requiredForApiKeys);
    
    // S'assurer que toutes les propriétés existent
    const synchronized = {
      enabled: parsed.enabled || false,
      requireForSave: parsed.requireForSave || false,
      requireForAccess: parsed.requireForAccess || false,
      requiredForSettings: parsed.requiredForSettings || false,
      requiredForApiKeys: parsed.requiredForApiKeys || false,
      authValidityMinutes: parsed.authValidityMinutes || 5,
      lastAuthTime: parsed.lastAuthTime
    };
    
    // Sauvegarder les paramètres synchronisés
    await AsyncStorage.setItem('biometric_settings', JSON.stringify(synchronized));
    logger.info('Paramètres synchronisés:', synchronized);
    
    return synchronized;
  } catch (error) {
    logger.error('Erreur lors de la synchronisation:', error);
    return null;
  }
};

// Fonction pour activer manuellement la protection des paramètres
export const enableSettingsProtection = async () => {
  try {
    const current = await AsyncStorage.getItem('biometric_settings');
    const settings = current ? JSON.parse(current) : {};
    
    const updated = {
      ...settings,
      enabled: true,
      requiredForSettings: true
    };
    
    await AsyncStorage.setItem('biometric_settings', JSON.stringify(updated));
    logger.info('✅ Protection des paramètres activée manuellement:', updated);
    
    // Vérifier immédiatement
    const verification = await AsyncStorage.getItem('biometric_settings');
    if (verification) {
      logger.info('Vérification après activation:', JSON.parse(verification));
    } else {
      logger.warn('Impossible de vérifier les paramètres après activation');
    }
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'activation:', error);
    return false;
  }
}; 