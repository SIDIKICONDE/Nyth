import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording } from '../types';
import { CumulativeStats } from '../hooks/useUserStats';

const STATS_STORAGE_KEY = 'userCumulativeStats';
const MIGRATION_FLAG_KEY = 'statsMigrationCompleted';

/**
 * Migre les statistiques existantes vers le nouveau système cumulatif
 * Cette fonction ne s'exécute qu'une seule fois par installation
 */
export const migrateToNewStatsSystem = async (): Promise<void> => {
  try {
    // Vérifier si la migration a déjà été effectuée
    const migrationCompleted = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (migrationCompleted === 'true') {
      return;
    }

    // Charger les enregistrements existants
    const savedRecordings = await AsyncStorage.getItem('recordings');
    let totalTime = 0;
    let totalCount = 0;

    if (savedRecordings) {
      const recordings: Recording[] = JSON.parse(savedRecordings);
      
      recordings.forEach((recording, index) => {
        let duration = 0;

        if (recording.duration && typeof recording.duration === 'number' && recording.duration > 0) {
          duration = recording.duration;
        } else {
          // Utiliser une estimation pour les anciens enregistrements sans durée
          duration = 30; // 30 secondes par défaut
        }

        totalTime += duration;
        totalCount++;
      });
    }

    // Créer les nouvelles statistiques cumulatives
    const cumulativeStats: CumulativeStats = {
      totalRecordingTime: totalTime,
      totalRecordingsCreated: totalCount,
      lastUpdated: new Date(),
    };

    // Sauvegarder les nouvelles statistiques
    await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(cumulativeStats));

    // Marquer la migration comme terminée
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  } catch (error) {}
};

/**
 * Réinitialise le flag de migration (utile pour les tests)
 */
export const resetMigrationFlag = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MIGRATION_FLAG_KEY);
  } catch (error) {}
};

/**
 * Formate la durée pour les logs
 */
const formatDurationForLog = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}; 