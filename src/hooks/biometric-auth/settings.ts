import AsyncStorage from '@react-native-async-storage/async-storage';
import { BiometricSettings } from './types';
import { BIOMETRIC_SETTINGS_KEY, DEFAULT_SETTINGS } from './constants';
import { createLogger } from '../../utils/optimizedLogger';

const logger = createLogger('BiometricSettings');

export const loadBiometricSettings = async (): Promise<{
  settings: BiometricSettings;
  wasAuthenticated: boolean;
}> => {
  try {
    const savedSettings = await AsyncStorage.getItem(BIOMETRIC_SETTINGS_KEY);
    logger.info('Chargement des paramètres biométriques:', savedSettings);
    
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      logger.info('Paramètres fusionnés:', merged);
      
      // Vérifier si l'authentification précédente est encore valide
      let wasAuthenticated = false;
      if (parsed.lastAuthTime) {
        const lastAuth = new Date(parsed.lastAuthTime);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastAuth.getTime()) / (1000 * 60);
        
        if (diffMinutes < (parsed.authValidityMinutes || DEFAULT_SETTINGS.authValidityMinutes)) {
          wasAuthenticated = true;
          logger.info('Authentification encore valide');
        }
      }
      
      return { settings: merged, wasAuthenticated };
    } else {
      logger.info('Aucun paramètre sauvegardé, utilisation des valeurs par défaut');
      return { settings: DEFAULT_SETTINGS, wasAuthenticated: false };
    }
  } catch (error) {
    logger.error('Erreur chargement paramètres biométrie:', error);
    return { settings: DEFAULT_SETTINGS, wasAuthenticated: false };
  }
};

export const saveBiometricSettings = async (
  currentSettings: BiometricSettings,
  updates: Partial<BiometricSettings>
): Promise<BiometricSettings> => {
  try {
    const updated = { ...currentSettings, ...updates };
    await AsyncStorage.setItem(BIOMETRIC_SETTINGS_KEY, JSON.stringify(updated));
    logger.info('Paramètres biométriques sauvegardés:', updated);
    return updated;
  } catch (error) {
    logger.error('Erreur sauvegarde paramètres biométrie:', error);
    throw error;
  }
}; 