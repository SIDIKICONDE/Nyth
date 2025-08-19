import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomTheme } from '../types/theme';
import { createLogger } from './optimizedLogger';

const logger = createLogger('ThemeStorage');
const THEME_STORAGE_KEY = 'selectedTheme';
const CUSTOM_THEMES_KEY = 'customThemes';

export const themeStorage = {
  // Save selected theme ID
  async saveSelectedTheme(themeId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
      logger.info(`Selected theme saved: ${themeId}`);
    } catch (error) {
      const errorMessage = 'Error saving selected theme';
      logger.error(errorMessage, error);
      throw error;
    }
  },

  // Get selected theme ID
  async getSelectedTheme(): Promise<string | null> {
    try {
      const themeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (themeId) {
        logger.info(`Selected theme loaded: ${themeId}`);
      }
      return themeId;
    } catch (error) {
      const errorMessage = 'Error loading selected theme';
      logger.error(errorMessage, error);
      return null;
    }
  },

  // Save custom themes
  async saveCustomThemes(themes: CustomTheme[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
      logger.info(`Custom themes saved: ${themes.length} themes`);
    } catch (error) {
      const errorMessage = 'Error saving custom themes';
      logger.error(errorMessage, error);
      throw error;
    }
  },

  // Get custom themes
  async getCustomThemes(): Promise<CustomTheme[]> {
    try {
      const savedThemes = await AsyncStorage.getItem(CUSTOM_THEMES_KEY);
      const themes = savedThemes ? JSON.parse(savedThemes) : [];
      logger.info(`Custom themes loaded: ${themes.length} themes`);
      return themes;
    } catch (error) {
      const errorMessage = 'Error loading custom themes';
      logger.error(errorMessage, error);
      return [];
    }
  },

  // Clear all theme data
  async clearThemeData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([THEME_STORAGE_KEY, CUSTOM_THEMES_KEY]);
      logger.info('Theme data cleared successfully');
    } catch (error) {
      const errorMessage = 'Error clearing theme data';
      logger.error(errorMessage, error);
      throw error;
    }
  }
}; 