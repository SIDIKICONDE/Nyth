import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import userPreferencesService, {
  UserPreferences,
} from "../services/firebase/userPreferencesService";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("useGlobalPreferences");

// Système de notification globale pour les mises à jour instantanées
let globalPreferencesListeners: (() => void)[] = [];

const notifyGlobalPreferencesUpdate = () => {
  globalPreferencesListeners.forEach((listener) => listener());
};

const addGlobalPreferencesListener = (listener: () => void) => {
  globalPreferencesListeners.push(listener);
  return () => {
    globalPreferencesListeners = globalPreferencesListeners.filter(
      (l) => l !== listener
    );
  };
};

// Clés AsyncStorage pour chaque type de préférence
const PREFERENCE_KEYS = {
  GUEST_FAB: "@guest_fab_enabled",
  FONT_FAMILY: "@font_preference",
  DISPLAY_PREFERENCES: "@display_preferences",
  AI_GENERATOR_PREFERENCES: "aiGeneratorPreferences",
  CHAT_PREFERENCES: "@chat_preferences",
  PROFILE_PREFERENCES: "@profile_preferences",
  RECORDING_SETTINGS: "recordingSettings",
  THEME_SETTINGS: "@selected_theme",
  LANGUAGE: "@language_preference",
  HOME_PAGE: "@home_page_preference",
  TELEPROMPTER_SETTINGS: "@teleprompter_settings",
  SECURITY_SETTINGS: "@security_settings",
  BIOMETRIC_SETTINGS: "@biometric_settings",
  ALERT_SETTINGS: "@alert_settings",
  PLANNING_PREFERENCES: "@planning_preferences",
};

export const useGlobalPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Références pour éviter les boucles infinies
  const lastUserRef = useRef<typeof user>(null);
  const isInitializedRef = useRef(false);

  // Écouter les mises à jour globales
  useEffect(() => {
    const unsubscribe = addGlobalPreferencesListener(() => {
      setForceUpdate((prev) => prev + 1);
      // Recharger les préférences depuis AsyncStorage pour synchroniser
      loadAllPreferences();
    });
    return unsubscribe;
  }, []);

  // Charger toutes les préférences au démarrage
  useEffect(() => {
    // Vérifier si l'utilisateur a vraiment changé
    const userChanged = lastUserRef.current !== user;

    // Ne charger que si l'utilisateur a changé ou lors de l'initialisation
    if (userChanged || !isInitializedRef.current) {
      lastUserRef.current = user;
      isInitializedRef.current = true;
      loadAllPreferences();
    }
  }, [user]);

  const isHomePage = (
    value: string
  ): value is NonNullable<UserPreferences["homePage"]> => {
    return value === "default" || value === "planning" || value === "ai-chat";
  };

  const loadAllPreferences = async () => {
    try {
      setIsLoading(true);

      if (user && !user.isGuest) {
        // Utilisateur connecté : charger depuis Firebase
        await loadFromFirebase();
      } else {
        // Invité : charger depuis AsyncStorage
        await loadFromLocal();
      }
    } catch (error) {
      logger.error("❌ Erreur lors du chargement des préférences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromFirebase = async () => {
    if (!user || user.isGuest) return;

    try {
      // 1. Charger depuis Firebase
      const cloudPrefs = await userPreferencesService.getPreferences(user.uid);

      if (cloudPrefs) {
        setPreferences(cloudPrefs);
        logger.info("✅ Préférences chargées depuis Firebase");

        // 2. Synchroniser avec le local
        await syncToLocal(cloudPrefs);
      } else {
        // 3. Si pas de préférences cloud, charger local et synchroniser
        const localPrefs = await loadFromLocal();
        if (Object.keys(localPrefs).length > 0) {
          await userPreferencesService.savePreferences(user.uid, localPrefs);
          logger.info("✅ Préférences locales synchronisées vers Firebase");
        }
      }
    } catch (error) {
      logger.error(
        "❌ Erreur Firebase, utilisation des préférences locales:",
        error
      );
      await loadFromLocal();
    }
  };

  const loadFromLocal = async (): Promise<UserPreferences> => {
    try {
      const localPrefs: UserPreferences = {};

      // Charger chaque type de préférence
      const [
        guestFAB,
        fontFamily,
        displayPrefs,
        aiGeneratorPrefs,
        chatPrefs,
        profilePrefs,
        recordingSettings,
        theme,
        language,
        homePage,
        teleprompterSettings,
        securitySettings,
        biometricSettings,
        alertSettings,
        planningPrefs,
      ] = await Promise.all([
        AsyncStorage.getItem(PREFERENCE_KEYS.GUEST_FAB),
        AsyncStorage.getItem(PREFERENCE_KEYS.FONT_FAMILY),
        AsyncStorage.getItem(PREFERENCE_KEYS.DISPLAY_PREFERENCES),
        AsyncStorage.getItem(PREFERENCE_KEYS.AI_GENERATOR_PREFERENCES),
        AsyncStorage.getItem(PREFERENCE_KEYS.CHAT_PREFERENCES),
        AsyncStorage.getItem(PREFERENCE_KEYS.PROFILE_PREFERENCES),
        AsyncStorage.getItem(PREFERENCE_KEYS.RECORDING_SETTINGS),
        AsyncStorage.getItem(PREFERENCE_KEYS.THEME_SETTINGS),
        AsyncStorage.getItem(PREFERENCE_KEYS.LANGUAGE),
        AsyncStorage.getItem(PREFERENCE_KEYS.HOME_PAGE),
        AsyncStorage.getItem(PREFERENCE_KEYS.TELEPROMPTER_SETTINGS),
        AsyncStorage.getItem(PREFERENCE_KEYS.SECURITY_SETTINGS),
        AsyncStorage.getItem(PREFERENCE_KEYS.BIOMETRIC_SETTINGS),
        AsyncStorage.getItem(PREFERENCE_KEYS.ALERT_SETTINGS),
        AsyncStorage.getItem(PREFERENCE_KEYS.PLANNING_PREFERENCES),
      ]);

      // Construire l'objet de préférences
      if (guestFAB !== null) localPrefs.guestFABEnabled = guestFAB === "true";
      if (fontFamily) localPrefs.fontFamily = fontFamily;
      if (theme) localPrefs.theme = theme;
      if (language) localPrefs.language = language;
      if (homePage && isHomePage(homePage)) localPrefs.homePage = homePage;

      if (displayPrefs) {
        const parsed = JSON.parse(displayPrefs);
        localPrefs.scriptDisplayStyle = parsed.scriptDisplayStyle;
      }

      if (aiGeneratorPrefs) {
        localPrefs.aiGeneratorPreferences = JSON.parse(aiGeneratorPrefs);
      }

      if (chatPrefs) {
        localPrefs.chatPreferences = JSON.parse(chatPrefs);
      }

      if (profilePrefs) {
        localPrefs.profilePreferences = JSON.parse(profilePrefs);
      }

      if (recordingSettings) {
        localPrefs.recordingSettings = JSON.parse(recordingSettings);
      }

      if (teleprompterSettings) {
        localPrefs.teleprompterSettings = JSON.parse(teleprompterSettings);
      }

      if (securitySettings) {
        localPrefs.securitySettings = JSON.parse(securitySettings);
      }

      if (biometricSettings) {
        // Note: biometricSettings sera ajouté au type UserPreferences plus tard
        (localPrefs as any).biometricSettings = JSON.parse(biometricSettings);
      }

      if (alertSettings) {
        localPrefs.alertSettings = JSON.parse(alertSettings);
      }

      if (planningPrefs) {
        (localPrefs as UserPreferences).planningPreferences =
          JSON.parse(planningPrefs);
      }

      setPreferences(localPrefs);
      logger.info("✅ Préférences chargées depuis le stockage local");

      return localPrefs;
    } catch (error) {
      logger.error("❌ Erreur lors du chargement local:", error);
      return {};
    }
  };

  const syncToLocal = async (prefs: UserPreferences) => {
    try {
      const promises: Promise<void>[] = [];

      if (prefs.guestFABEnabled !== undefined) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.GUEST_FAB,
            String(prefs.guestFABEnabled)
          )
        );
      }

      if (prefs.fontFamily) {
        promises.push(
          AsyncStorage.setItem(PREFERENCE_KEYS.FONT_FAMILY, prefs.fontFamily)
        );
      }

      if (prefs.theme) {
        promises.push(
          AsyncStorage.setItem(PREFERENCE_KEYS.THEME_SETTINGS, prefs.theme)
        );
      }

      if (prefs.language) {
        promises.push(
          AsyncStorage.setItem(PREFERENCE_KEYS.LANGUAGE, prefs.language)
        );
      }

      if (prefs.homePage) {
        promises.push(
          AsyncStorage.setItem(PREFERENCE_KEYS.HOME_PAGE, prefs.homePage)
        );
      }

      if (prefs.scriptDisplayStyle) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.DISPLAY_PREFERENCES,
            JSON.stringify({
              scriptDisplayStyle: prefs.scriptDisplayStyle,
            })
          )
        );
      }

      if (prefs.aiGeneratorPreferences) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.AI_GENERATOR_PREFERENCES,
            JSON.stringify(prefs.aiGeneratorPreferences)
          )
        );
      }

      if (prefs.chatPreferences) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.CHAT_PREFERENCES,
            JSON.stringify(prefs.chatPreferences)
          )
        );
      }

      if (prefs.profilePreferences) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.PROFILE_PREFERENCES,
            JSON.stringify(prefs.profilePreferences)
          )
        );
      }

      if (prefs.recordingSettings) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.RECORDING_SETTINGS,
            JSON.stringify(prefs.recordingSettings)
          )
        );
      }

      if (prefs.teleprompterSettings) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.TELEPROMPTER_SETTINGS,
            JSON.stringify(prefs.teleprompterSettings)
          )
        );
      }

      if ((prefs as any).biometricSettings) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.BIOMETRIC_SETTINGS,
            JSON.stringify((prefs as any).biometricSettings)
          )
        );
      }

      if (prefs.securitySettings) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.SECURITY_SETTINGS,
            JSON.stringify(prefs.securitySettings)
          )
        );
      }

      if (prefs.alertSettings) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.ALERT_SETTINGS,
            JSON.stringify(prefs.alertSettings)
          )
        );
      }

      if (prefs.planningPreferences) {
        promises.push(
          AsyncStorage.setItem(
            PREFERENCE_KEYS.PLANNING_PREFERENCES,
            JSON.stringify(prefs.planningPreferences)
          )
        );
      }

      await Promise.all(promises);
      logger.info("✅ Préférences synchronisées vers le stockage local");
    } catch (error) {
      logger.error("❌ Erreur lors de la synchronisation locale:", error);
    }
  };

  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(
      key: K,
      value: UserPreferences[K]
    ) => {
      try {
        setIsSyncing(true);

        // 1. Mettre à jour l'état local
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);

        // 2. Sauvegarder dans AsyncStorage selon le type
        await saveToLocalStorage(key, value);

        // 3. Synchroniser avec Firebase si connecté
        if (user && !user.isGuest) {
          await userPreferencesService.updatePreference(user.uid, key, value);
          logger.info(`✅ Préférence ${key} synchronisée avec Firebase`);
        }

        // 4. Notifier tous les autres composants pour mise à jour instantanée
        notifyGlobalPreferencesUpdate();
      } catch (error) {
        logger.error(`❌ Erreur lors de la mise à jour de ${key}:`, error);
      } finally {
        setIsSyncing(false);
      }
    },
    [user, preferences]
  );

  const saveToLocalStorage = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    try {
      switch (key) {
        case "guestFABEnabled":
          await AsyncStorage.setItem(PREFERENCE_KEYS.GUEST_FAB, String(value));
          break;
        case "fontFamily":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.FONT_FAMILY,
            String(value)
          );
          break;
        case "theme":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.THEME_SETTINGS,
            String(value)
          );
          break;
        case "language":
          await AsyncStorage.setItem(PREFERENCE_KEYS.LANGUAGE, String(value));
          break;
        case "homePage":
          await AsyncStorage.setItem(PREFERENCE_KEYS.HOME_PAGE, String(value));
          break;
        case "scriptDisplayStyle":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.DISPLAY_PREFERENCES,
            JSON.stringify({
              scriptDisplayStyle: value,
            })
          );
          break;
        case "aiGeneratorPreferences":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.AI_GENERATOR_PREFERENCES,
            JSON.stringify(value)
          );
          break;
        case "chatPreferences":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.CHAT_PREFERENCES,
            JSON.stringify(value)
          );
          break;
        case "profilePreferences":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.PROFILE_PREFERENCES,
            JSON.stringify(value)
          );
          break;
        case "recordingSettings":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.RECORDING_SETTINGS,
            JSON.stringify(value)
          );
          break;
        case "teleprompterSettings":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.TELEPROMPTER_SETTINGS,
            JSON.stringify(value)
          );
          break;
        case "securitySettings":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.SECURITY_SETTINGS,
            JSON.stringify(value)
          );
          break;
        case "alertSettings":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.ALERT_SETTINGS,
            JSON.stringify(value)
          );
          break;
        case "planningPreferences":
          await AsyncStorage.setItem(
            PREFERENCE_KEYS.PLANNING_PREFERENCES,
            JSON.stringify(value)
          );
          break;
        default:
          logger.warn(`⚠️ Clé de stockage non reconnue: ${key}`);
          break;
      }
    } catch (error) {
      logger.error(`❌ Erreur sauvegarde locale ${key}:`, error);
    }
  };

  const migrateAllPreferences = useCallback(async () => {
    if (!user || user.isGuest) return;

    try {
      setIsSyncing(true);
      const localPrefs = await loadFromLocal();
      await userPreferencesService.migrateLocalPreferences(
        user.uid,
        localPrefs
      );
      logger.info("✅ Toutes les préférences ont été migrées vers Firebase");
    } catch (error) {
      logger.error("❌ Erreur lors de la migration:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Méthode pour sauvegarder les paramètres d'enregistrement
  const updateRecordingSettings = useCallback(
    async (settings: any) => {
      await updatePreference("recordingSettings", settings);
    },
    [updatePreference]
  );

  // Méthode pour sauvegarder les paramètres de téléprompteur
  const updateTeleprompterSettings = useCallback(
    async (settings: any) => {
      await updatePreference("teleprompterSettings", settings);
    },
    [updatePreference]
  );

  // Méthode pour sauvegarder les paramètres de sécurité
  const updateSecuritySettings = useCallback(
    async (settings: any) => {
      await updatePreference("securitySettings", settings);
    },
    [updatePreference]
  );

  // Méthode pour sauvegarder les paramètres d'alertes
  const updateAlertSettings = useCallback(
    async (settings: any) => {
      await updatePreference("alertSettings", settings);
    },
    [updatePreference]
  );

  return {
    // État des préférences
    ...preferences,
    preferences,
    isLoading,
    isSyncing,

    // Actions
    updatePreference,
    updateRecordingSettings,
    updateTeleprompterSettings,
    updateSecuritySettings,
    updateAlertSettings,
    migrateAllPreferences,

    // Actions de rechargement
    reload: loadAllPreferences,
  };
};
