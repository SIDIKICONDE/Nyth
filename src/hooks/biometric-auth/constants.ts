import { BiometricSettings } from './types';

export const BIOMETRIC_SETTINGS_KEY = 'biometric_settings';

export const DEFAULT_SETTINGS: BiometricSettings = {
  enabled: false, // Désactivé par défaut pour éviter les surprises
  requiredForApiKeys: false,
  requiredForSettings: false,
  requireForAccess: false,
  requireForSave: false,
  authValidityMinutes: 5, // Authentification valide pendant 5 minutes
}; 