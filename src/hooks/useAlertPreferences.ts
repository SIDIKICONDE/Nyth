import { useGlobalPreferencesContext } from "../contexts/GlobalPreferencesContext";

export interface AlertSettings {
  disableAllAlerts: boolean;
  disableSaveConfirmations: boolean;
  disableResetConfirmations: boolean;
  disableErrorAlerts: boolean;
}

export function useAlertPreferences() {
  const { alertSettings, updateAlertSettings } = useGlobalPreferencesContext();

  // Valeurs par défaut si alertSettings n'existe pas encore
  const defaultSettings: AlertSettings = {
    disableAllAlerts: false,
    disableSaveConfirmations: false,
    disableResetConfirmations: false,
    disableErrorAlerts: false,
  };

  const currentSettings = alertSettings || defaultSettings;

  const updateAlertSetting = async (
    key: keyof AlertSettings,
    value: boolean
  ) => {
    const newSettings = {
      ...currentSettings,
      [key]: value,
    };

    await updateAlertSettings(newSettings);
  };

  return {
    alertSettings: currentSettings,
    updateAlertSetting,
    disableAllAlerts: currentSettings.disableAllAlerts,
    disableSaveConfirmations: currentSettings.disableSaveConfirmations,
    disableResetConfirmations: currentSettings.disableResetConfirmations,
    disableErrorAlerts: currentSettings.disableErrorAlerts,
  };
}
