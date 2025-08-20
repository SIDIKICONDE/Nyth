import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALERTS_DISABLED_KEY = '@alerts_disabled';

interface AlertSettings {
  disableAllAlerts: boolean;
  disableSaveConfirmations: boolean;
  disableResetConfirmations: boolean;
  disableErrorAlerts: boolean;
}

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  disableAllAlerts: false,
  disableSaveConfirmations: true, // Désactivé par défaut comme demandé
  disableResetConfirmations: false,
  disableErrorAlerts: false,
};

class AlertManager {
  private settings: AlertSettings = DEFAULT_ALERT_SETTINGS;
  private initialized = false;
  private globalPreferencesGetter: (() => AlertSettings | undefined) | null = null;

  // Permet d'injecter une fonction pour obtenir les préférences globales
  setGlobalPreferencesGetter(getter: () => AlertSettings | undefined) {
    this.globalPreferencesGetter = getter;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Si on a un getter pour les préférences globales, l'utiliser
      if (this.globalPreferencesGetter) {
        const globalSettings = this.globalPreferencesGetter();
        if (globalSettings) {
          this.settings = globalSettings;
          this.initialized = true;
          return;
        }
      }

      // Sinon, utiliser AsyncStorage (fallback)
      const saved = await AsyncStorage.getItem(ALERTS_DISABLED_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(saved) };
      }
      this.initialized = true;
    } catch (error) {
      this.settings = DEFAULT_ALERT_SETTINGS;
      this.initialized = true;
    }
  }

  async updateSettings(newSettings: Partial<AlertSettings>) {
    await this.initialize();
    
    this.settings = { ...this.settings, ...newSettings };
    
    // Si on a des préférences globales, ne pas sauvegarder dans AsyncStorage
    if (this.globalPreferencesGetter) {
      return;
    }
    
    try {
      await AsyncStorage.setItem(ALERTS_DISABLED_KEY, JSON.stringify(this.settings));
    } catch (error) {}
  }

  async getSettings(): Promise<AlertSettings> {
    await this.initialize();
    
    // Si on a un getter pour les préférences globales, l'utiliser
    if (this.globalPreferencesGetter) {
      const globalSettings = this.globalPreferencesGetter();
      if (globalSettings) {
        this.settings = globalSettings;
      }
    }
    
    return this.settings;
  }

  // Alertes de confirmation de sauvegarde
  async showSaveConfirmation(title: string, message: string, onConfirm?: () => void) {
    await this.initialize();
    
    const settings = await this.getSettings();
    if (settings.disableAllAlerts || settings.disableSaveConfirmations) {
      onConfirm?.();
      return;
    }

    Alert.alert(title, message, [
      { text: 'OK', onPress: onConfirm }
    ]);
  }

  // Alertes de confirmation de réinitialisation
  async showResetConfirmation(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
    await this.initialize();
    
    const settings = await this.getSettings();
    if (settings.disableAllAlerts || settings.disableResetConfirmations) {
      onConfirm();
      return;
    }

    Alert.alert(title, message, [
      {
        text: 'Annuler',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  }

  // Alertes d'erreur
  async showError(title: string, message: string, onPress?: () => void) {
    await this.initialize();
    
    const settings = await this.getSettings();
    if (settings.disableAllAlerts || settings.disableErrorAlerts) {
      onPress?.();
      return;
    }

    Alert.alert(title, message, [
      { text: 'OK', onPress }
    ]);
  }

  // Alerte générique avec vérification des paramètres
  async showAlert(title: string, message: string, buttons?: any[], type: 'save' | 'reset' | 'error' | 'general' = 'general') {
    await this.initialize();
    
    const settings = await this.getSettings();
    const shouldHide = settings.disableAllAlerts || 
      (type === 'save' && settings.disableSaveConfirmations) ||
      (type === 'reset' && settings.disableResetConfirmations) ||
      (type === 'error' && settings.disableErrorAlerts);

    if (shouldHide) {
      // Exécuter le premier bouton par défaut si disponible
      if (buttons && buttons.length > 0 && buttons[0].onPress) {
        buttons[0].onPress();
      }
      return;
    }

    Alert.alert(title, message, buttons);
  }

  // Méthodes de convenance pour activer/désactiver rapidement
  async disableAllAlerts() {
    await this.updateSettings({ disableAllAlerts: true });
  }

  async enableAllAlerts() {
    await this.updateSettings({ disableAllAlerts: false });
  }

  async disableSaveAlerts() {
    await this.updateSettings({ disableSaveConfirmations: true });
  }

  async enableSaveAlerts() {
    await this.updateSettings({ disableSaveConfirmations: false });
  }
}

// Instance singleton
export const alertManager = new AlertManager();

// Fonctions utilitaires pour remplacer Alert.alert
export const showAlert = (title: string, message: string, buttons?: any[], type?: 'save' | 'reset' | 'error' | 'general') => {
  return alertManager.showAlert(title, message, buttons, type);
};

export const showSaveConfirmation = (title: string, message: string, onConfirm?: () => void) => {
  return alertManager.showSaveConfirmation(title, message, onConfirm);
};

export const showResetConfirmation = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
  return alertManager.showResetConfirmation(title, message, onConfirm, onCancel);
};

export const showError = (title: string, message: string, onPress?: () => void) => {
  return alertManager.showError(title, message, onPress);
};

export default alertManager; 