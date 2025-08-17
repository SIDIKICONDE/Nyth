import { useEffect, useState } from "react";
import { createLogger } from "../../utils/optimizedLogger";
import { useTranslation } from "../useTranslation";
import { checkBiometricSupport, performAuthentication } from "./auth";
import { DEFAULT_SETTINGS } from "./constants";
import { loadBiometricSettings, saveBiometricSettings } from "./settings";
import { BiometricSettings } from "./types";

const logger = createLogger("BiometricAuth");

export const useBiometricAuth = () => {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [settings, setSettings] = useState<BiometricSettings>(DEFAULT_SETTINGS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeBiometric();
  }, []);

  const initializeBiometric = async () => {
    // Vérifier le support biométrique
    const support = await checkBiometricSupport();
    setIsSupported(support.hasHardware);
    setIsEnrolled(support.isEnrolled);

    // Charger les paramètres
    const { settings: loadedSettings, wasAuthenticated } =
      await loadBiometricSettings();
    setSettings(loadedSettings);
    setIsAuthenticated(wasAuthenticated);
  };

  const saveSettings = async (newSettings: Partial<BiometricSettings>) => {
    try {
      const updated = await saveBiometricSettings(settings, newSettings);
      setSettings(updated);
    } catch (error) {
      logger.error("Erreur sauvegarde paramètres biométrie:", error);
    }
  };

  const authenticate = async (
    reason?: string,
    options?: any
  ): Promise<boolean> => {
    try {
      logger.info("authenticate appelé avec raison:", reason);

      // Si pas de support ou pas activé, autoriser l'accès
      if (!isSupported || !isEnrolled || !settings.enabled) {
        logger.info("Biométrie non disponible/activée, accès autorisé");
        return true;
      }

      // Si déjà authentifié récemment, ne pas redemander
      if (isAuthenticated) {
        logger.info("Déjà authentifié récemment, skip authentification");
        return true;
      }

      const result = await performAuthentication({
        promptMessage:
          reason ||
          t("biometric.defaultPrompt", "Authentifiez-vous pour continuer"),
        cancelLabel: t("common.cancel"),
        fallbackLabel: t("biometric.fallback", "Entrer le code"),
        // disableDeviceFallback: false,
        ...options,
      });

      if (result) {
        setIsAuthenticated(true);
        // Sauvegarder l'heure de l'authentification
        await saveSettings({ lastAuthTime: new Date().toISOString() });
      } else {
        // En cas d'échec, ne pas bloquer définitivement
        // L'utilisateur peut réessayer
        logger.info(
          "Authentification échouée, mais nouvelle tentative possible"
        );
      }

      return result;
    } catch (error) {
      logger.error("Erreur authentification:", error);
      return false;
    }
  };

  const requireAuthForApiKeys = async (): Promise<boolean> => {
    if (!settings.requiredForApiKeys) return true;

    return authenticate(
      t("biometric.apiKeys", "Authentifiez-vous pour accéder aux clés API"),
      {
        // disableDeviceFallback: false,
        fallbackLabel: t("biometric.fallback", "Entrer le code"),
      }
    );
  };

  const requireAuthForSettings = async (): Promise<boolean> => {
    logger.info("requireAuthForSettings appelé");
    logger.info("requiredForSettings:", settings.requiredForSettings);

    if (!settings.requiredForSettings) {
      logger.info("Protection des paramètres non requise");
      return true;
    }

    if (!isSupported || !isEnrolled || !settings.enabled) {
      logger.info("Biométrie non disponible pour les paramètres");
      return true;
    }

    logger.info("Lancement authentification directe pour paramètres");

    try {
      const result = await performAuthentication({
        promptMessage: t(
          "biometric.settingsAccess",
          "Authentifiez-vous pour accéder aux paramètres AI"
        ),
        cancelLabel: t("common.cancel"),
        fallbackLabel: t("biometric.fallback", "Entrer le code"),
        // disableDeviceFallback: false,
      });

      if (result) {
        logger.info("✅ Authentification paramètres réussie");
        setIsAuthenticated(true);
        await saveSettings({ lastAuthTime: new Date().toISOString() });
      } else {
        logger.info("❌ Authentification paramètres échouée");
      }

      return result;
    } catch (error) {
      logger.error("Erreur authentification paramètres:", error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    saveSettings({ lastAuthTime: undefined });
  };

  const resetAuthState = () => {
    logger.info(
      "Réinitialisation de l'état d'authentification pour nouvelle tentative"
    );
    setIsAuthenticated(false);
    // Effacer aussi lastAuthTime pour forcer une nouvelle auth
    saveSettings({ lastAuthTime: undefined });
  };

  const toggleBiometric = async (enabled: boolean) => {
    if (enabled && (!isSupported || !isEnrolled)) {
      return false;
    }

    await saveSettings({ enabled });
    return true;
  };

  const updateRequirements = async (requirements: {
    requiredForApiKeys?: boolean;
    requiredForSettings?: boolean;
  }) => {
    await saveSettings(requirements);
  };

  return {
    // État
    isSupported,
    isEnrolled,
    isEnabled: settings.enabled,
    isAuthenticated,
    settings,

    // Actions
    authenticate,
    requireAuthForApiKeys,
    requireAuthForSettings,
    logout,
    resetAuthState,
    toggleBiometric,
    updateRequirements,
    loadSettings: initializeBiometric,

    // Utils
    checkBiometricSupport: initializeBiometric,
  };
};
