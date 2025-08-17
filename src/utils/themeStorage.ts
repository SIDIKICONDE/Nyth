import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomTheme } from '../types/theme';
import { createLogger } from './optimizedLogger';
import i18n from '../locales/i18n';

const logger = createLogger('ThemeStorage');
const THEME_STORAGE_KEY = 'selectedTheme';
const CUSTOM_THEMES_KEY = 'customThemes';

export const themeStorage = {
  // Save selected theme ID
  async saveSelectedTheme(themeId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
      logger.info(i18n.t('themeStorage.selectedTheme.saved', 'Selected theme saved: {{themeId}}', { themeId }));
    } catch (error) {
      const errorMessage = i18n.t('themeStorage.selectedTheme.saveError', 'Error saving selected theme');
      logger.error(errorMessage, error);
      throw error;
    }
  },

  // Get selected theme ID
  async getSelectedTheme(): Promise<string | null> {
    try {
      const themeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (themeId) {
        logger.info(i18n.t('themeStorage.selectedTheme.loaded', 'Selected theme loaded: {{themeId}}', { themeId }));
      }
      return themeId;
    } catch (error) {
      const errorMessage = i18n.t('themeStorage.selectedTheme.loadError', 'Error loading selected theme');
      logger.error(errorMessage, error);
      return null;
    }
  },

  // Save custom themes
  async saveCustomThemes(themes: CustomTheme[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
      logger.info(i18n.t('themeStorage.customThemes.saved', 'Custom themes saved: {{count}} themes', { count: themes.length }));
    } catch (error) {
      const errorMessage = i18n.t('themeStorage.customThemes.saveError', 'Error saving custom themes');
      logger.error(errorMessage, error);
      throw error;
    }
  },

  // Get custom themes
  async getCustomThemes(): Promise<CustomTheme[]> {
    try {
      const savedThemes = await AsyncStorage.getItem(CUSTOM_THEMES_KEY);
      const themes = savedThemes ? JSON.parse(savedThemes) : [];
      logger.info(i18n.t('themeStorage.customThemes.loaded', 'Custom themes loaded: {{count}} themes', { count: themes.length }));
      return themes;
    } catch (error) {
      const errorMessage = i18n.t('themeStorage.customThemes.loadError', 'Error loading custom themes');
      logger.error(errorMessage, error);
      return [];
    }
  },

  // Clear all theme data
  async clearThemeData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([THEME_STORAGE_KEY, CUSTOM_THEMES_KEY]);
      logger.info(i18n.t('themeStorage.clear.success', 'Theme data cleared successfully'));
    } catch (error) {
      const errorMessage = i18n.t('themeStorage.clear.error', 'Error clearing theme data');
      logger.error(errorMessage, error);
      throw error;
    }
  }
}; 