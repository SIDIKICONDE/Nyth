import AsyncStorage from '@react-native-async-storage/async-storage';
import hybridStorageService from './hybridStorageService';
import { Script, Recording } from '../../types';

class MigrationService {
  private migrationKey = '@migration_completed';

  async isMigrationCompleted(): Promise<boolean> {
    try {
      const status = await AsyncStorage.getItem(this.migrationKey);
      return status === 'true';
    } catch {
      return false;
    }
  }

  async markMigrationCompleted() {
    await AsyncStorage.setItem(this.migrationKey, 'true');
  }

  async migrateToFirebase(userId: string) {
    try {
      // Vérifier si la migration a déjà été effectuée
      if (await this.isMigrationCompleted()) {
        return;
      }

      // 1. Migrer les scripts
      await this.migrateScripts(userId);

      // 2. Migrer les métadonnées des enregistrements (pas les vidéos)
      await this.migrateRecordingMetadata(userId);

      // 3. Migrer les statistiques cumulatives
      await this.migrateCumulativeStats(userId);

      // 4. Migrer les préférences utilisateur
      await this.migrateUserPreferences(userId);

      // Marquer la migration comme terminée
      await this.markMigrationCompleted();
    } catch (error) {
      throw error;
    }
  }

  private async migrateScripts(userId: string) {
    try {
      const scriptsJson = await AsyncStorage.getItem('@scripts');
      if (!scriptsJson) return;

      const scripts: Script[] = JSON.parse(scriptsJson);

      for (const script of scripts) {
        try {
          await hybridStorageService.saveScript(userId, {
            title: script.title,
            content: script.content,
            isFavorite: script.isFavorite || false
          });
        } catch (error) {}
      }
    } catch (error) {}
  }

  private async migrateRecordingMetadata(userId: string) {
    try {
      const recordingsJson = await AsyncStorage.getItem('@recordings');
      if (!recordingsJson) return;

      const recordings: Recording[] = JSON.parse(recordingsJson);

      // Initialiser le stockage local
      await hybridStorageService.initializeLocalStorage();

      for (const recording of recordings) {
        try {
          // Les vidéos restent locales, on migre juste les métadonnées
          // On suppose que les vidéos sont déjà dans le bon répertoire local
          const videoUri = recording.uri || recording.videoUri;
          await hybridStorageService.saveRecording(
            userId,
            videoUri,
            recording.duration,
            recording.scriptId,
            recording.scriptTitle,
            recording.thumbnailUri
          );
        } catch (error) {}
      }
    } catch (error) {}
  }

  private async migrateCumulativeStats(userId: string) {
    try {
      const statsJson = await AsyncStorage.getItem('@cumulative_stats');
      if (!statsJson) return;

      const stats = JSON.parse(statsJson);

      await hybridStorageService.updateUserStats(userId, {
        totalRecordingsCreated: stats.totalRecordingsCreated || 0,
        totalRecordingTime: stats.totalRecordingTime || 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {}
  }

  private async migrateUserPreferences(userId: string) {
    try {
      // Migrer les préférences de sections du profil
      const profilePrefsJson = await AsyncStorage.getItem('@profile_preferences');
      if (profilePrefsJson) {
        const prefs = JSON.parse(profilePrefsJson);
        await AsyncStorage.setItem(`@profile_preferences_${userId}`, profilePrefsJson);
      }

      // Migrer d'autres préférences si nécessaire
      const aiSettingsJson = await AsyncStorage.getItem('@ai_settings');
      if (aiSettingsJson) {
        await AsyncStorage.setItem(`@ai_settings_${userId}`, aiSettingsJson);
      }
    } catch (error) {}
  }

  // Nettoyer les anciennes données après migration réussie
  async cleanupOldData() {
    try {
      const keysToRemove = [
        '@scripts',
        '@recordings',
        '@cumulative_stats',
        '@profile_preferences',
        '@ai_settings'
      ];

      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {}
  }
}

export default new MigrationService(); 