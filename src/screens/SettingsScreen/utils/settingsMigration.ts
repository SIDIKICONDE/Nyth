import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordingSettings } from '../../../types';
import { DEFAULT_RECORDING_SETTINGS } from './settingsDefaults';
import { createLogger } from '../../../utils/optimizedLogger';

const logger = createLogger('SettingsMigration');

/**
 * Migre les anciens paramètres vers le nouveau format
 */
export const migrateSettings = async (): Promise<RecordingSettings> => {
  try {
    const savedSettings = await AsyncStorage.getItem('recordingSettings');
    
    if (!savedSettings) {
      logger.info('✅ Aucun paramètre sauvegardé, utilisation des valeurs par défaut');
      return DEFAULT_RECORDING_SETTINGS;
    }

    const parsedSettings = JSON.parse(savedSettings);
    logger.info('📦 Paramètres chargés depuis le stockage');

    // Vérifier si les paramètres audio/vidéo sont corrects
    const needsMigration = 
      parsedSettings.isMicEnabled === false ||
      parsedSettings.isVideoEnabled === false ||
      parsedSettings.audioEnabled === false ||
      parsedSettings.videoEnabled === false;

    if (needsMigration) {
      logger.warn('⚠️ Paramètres audio/vidéo désactivés détectés, migration nécessaire');
      
      // Forcer l'activation des paramètres audio/vidéo
      const migratedSettings = {
        ...DEFAULT_RECORDING_SETTINGS,
        ...parsedSettings,
        // Forcer l'activation
        isMicEnabled: true,
        isVideoEnabled: true,
        audioEnabled: true,
        videoEnabled: true,
        // Préserver les autres paramètres utilisateur
        fontSize: parsedSettings.fontSize || DEFAULT_RECORDING_SETTINGS.fontSize,
        textColor: parsedSettings.textColor || DEFAULT_RECORDING_SETTINGS.textColor,
        scrollSpeed: parsedSettings.scrollSpeed || DEFAULT_RECORDING_SETTINGS.scrollSpeed,
        // S'assurer que videoSettings existe
        videoSettings: {
          ...DEFAULT_RECORDING_SETTINGS.videoSettings,
          ...(parsedSettings.videoSettings || {})
        }
      };

      // Sauvegarder les paramètres migrés
      await AsyncStorage.setItem('recordingSettings', JSON.stringify(migratedSettings));
      logger.info('✅ Paramètres migrés et sauvegardés');
      
      return migratedSettings;
    }

    // Fusionner avec les valeurs par défaut pour les nouveaux paramètres
    const mergedSettings = {
      ...DEFAULT_RECORDING_SETTINGS,
      ...parsedSettings,
      videoSettings: {
        ...DEFAULT_RECORDING_SETTINGS.videoSettings,
        ...(parsedSettings.videoSettings || {})
      }
    };

    logger.info('✅ Paramètres fusionnés avec les valeurs par défaut');
    return mergedSettings;

  } catch (error) {
    logger.error('❌ Erreur lors de la migration des paramètres:', error);
    return DEFAULT_RECORDING_SETTINGS;
  }
};

/**
 * Force la réinitialisation des paramètres audio/vidéo
 */
export const forceEnableAudioVideo = async (): Promise<void> => {
  try {
    const savedSettings = await AsyncStorage.getItem('recordingSettings');
    
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      
      const updatedSettings = {
        ...parsedSettings,
        isMicEnabled: true,
        isVideoEnabled: true,
        audioEnabled: true,
        videoEnabled: true
      };

      await AsyncStorage.setItem('recordingSettings', JSON.stringify(updatedSettings));
      logger.info('✅ Paramètres audio/vidéo forcés à activé');
    }
  } catch (error) {
    logger.error('❌ Erreur lors de la force d\'activation audio/vidéo:', error);
  }
}; 