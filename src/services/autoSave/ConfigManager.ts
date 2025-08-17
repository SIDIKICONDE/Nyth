import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutoSaveConfig } from './types';

/**
 * Gestionnaire de configuration pour la sauvegarde automatique
 */
export class ConfigManager {
  private static defaultConfig: AutoSaveConfig = {
    enabled: true,
    interval: 30000, // 30 secondes
    cloudBackup: false,
    maxLocalBackups: 10,
    maxCloudBackups: 5,
  };

  /**
   * Charge la configuration depuis AsyncStorage
   */
  static async loadConfig(): Promise<AutoSaveConfig> {
    try {
      const savedConfig = await AsyncStorage.getItem('autoSaveConfig');
      if (savedConfig) {
        return { ...this.defaultConfig, ...JSON.parse(savedConfig) };
      }
      return this.defaultConfig;
    } catch (error) {
      return this.defaultConfig;
    }
  }

  /**
   * Sauvegarde la configuration dans AsyncStorage
   */
  static async saveConfig(config: Partial<AutoSaveConfig>): Promise<AutoSaveConfig> {
    try {
      const currentConfig = await this.loadConfig();
      const newConfig = { ...currentConfig, ...config };
      await AsyncStorage.setItem('autoSaveConfig', JSON.stringify(newConfig));
      return newConfig;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Réinitialise la configuration aux valeurs par défaut
   */
  static async resetConfig(): Promise<AutoSaveConfig> {
    try {
      await AsyncStorage.removeItem('autoSaveConfig');
      return this.defaultConfig;
    } catch (error) {
      throw error;
    }
  }
} 