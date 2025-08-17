export interface BiometricSettings {
  enabled: boolean;
  requiredForApiKeys?: boolean;
  requiredForSettings: boolean;
  requireForAccess: boolean;
  requireForSave: boolean;
  lastAuthTime?: string;
  authValidityMinutes?: number;
}

export interface BiometricAuthState {
  isSupported: boolean;
  isEnrolled: boolean;
  isAuthenticated: boolean;
  settings: BiometricSettings;
}

export interface BiometricAuthOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
} 