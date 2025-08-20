import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

// Événement global pour forcer la mise à jour de tous les composants
let globalListeners: (() => void)[] = [];

const notifyGlobalUpdate = () => {
  globalListeners.forEach((listener) => listener());
};

const addGlobalListener = (listener: () => void) => {
  globalListeners.push(listener);
  return () => {
    globalListeners = globalListeners.filter((l) => l !== listener);
  };
};

export type WelcomeBubbleFrequency =
  | "never" // Jamais
  | "once" // Une seule fois
  | "daily" // Une fois par jour
  | "session" // À chaque ouverture d'app
  | "connection" // À chaque connexion
  | "twice_daily" // Deux fois par jour
  | "hourly"; // Toutes les heures

export interface WelcomeBubbleSettings {
  frequency: WelcomeBubbleFrequency;
  lastShown: string | null;
  showCount: number;
  showHeaderWelcome: boolean;
}

const STORAGE_KEY = "@welcome_bubble_preferences";
const DEFAULT_SETTINGS: WelcomeBubbleSettings = {
  frequency: "daily",
  lastShown: null,
  showCount: 0,
  showHeaderWelcome: true,
};

export const useWelcomeBubblePreferences = () => {
  const [settings, setSettings] =
    useState<WelcomeBubbleSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Écouter les mises à jour globales
  useEffect(() => {
    const unsubscribe = addGlobalListener(() => {
      setForceUpdate((prev) => prev + 1);
      loadSettings(); // Recharger depuis AsyncStorage
    });
    return unsubscribe;
  }, []);

  // Charger les préférences au démarrage
  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        const newSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };
        setSettings(newSettings);
      }
    } catch (error) {} finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(
    async (newSettings: WelcomeBubbleSettings) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
        // Notifier tous les autres composants
        notifyGlobalUpdate();
      } catch (error) {}
    },
    []
  );

  const updateFrequency = useCallback(
    async (frequency: WelcomeBubbleFrequency) => {
      const newSettings = { ...settings, frequency };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  const updateHeaderWelcome = useCallback(
    async (showHeaderWelcome: boolean) => {
      const newSettings = { ...settings, showHeaderWelcome };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  const shouldShowWelcome = useCallback(async (): Promise<boolean> => {
    if (!isLoaded) return false;

    const now = new Date();
    const currentTime = now.getTime();
    const currentDate = now.toDateString();
    const currentHour = now.getHours();

    switch (settings.frequency) {
      case "never":
        return false;

      case "once":
        return settings.showCount === 0;

      case "daily":
        return settings.lastShown !== currentDate;

      case "session":
        // À chaque ouverture d'app (pas de vérification de date)
        return true;

      case "connection":
        // À chaque connexion (similaire à session pour notre cas)
        return true;

      case "twice_daily":
        if (!settings.lastShown) return true;

        const lastShownDate = new Date(settings.lastShown);
        const lastShownHour = lastShownDate.getHours();

        // Première fois le matin (6h-12h), deuxième fois l'après-midi/soir (14h-20h)
        if (currentHour >= 6 && currentHour < 12 && lastShownHour >= 14) {
          return true; // Nouveau cycle matin
        }
        if (currentHour >= 14 && currentHour < 20 && lastShownHour < 12) {
          return true; // Deuxième fois dans la journée
        }

        return lastShownDate.toDateString() !== currentDate;

      case "hourly":
        if (!settings.lastShown) return true;

        const lastShownTime = new Date(settings.lastShown).getTime();
        const oneHour = 60 * 60 * 1000; // 1 heure en millisecondes

        return currentTime - lastShownTime >= oneHour;

      default:
        return false;
    }
  }, [isLoaded, settings]);

  const markAsShown = useCallback(async () => {
    const newSettings = {
      ...settings,
      lastShown: new Date().toISOString(),
      showCount: settings.showCount + 1,
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const getFrequencyLabel = useCallback(
    (frequency: WelcomeBubbleFrequency): string => {
      const labels = {
        never: "Jamais",
        once: "Une seule fois",
        daily: "Une fois par jour",
        session: "À chaque ouverture",
        connection: "À chaque connexion",
        twice_daily: "Deux fois par jour",
        hourly: "Toutes les heures",
      };
      return labels[frequency];
    },
    []
  );

  const getFrequencyDescription = useCallback(
    (frequency: WelcomeBubbleFrequency): string => {
      const descriptions = {
        never: "Le message de bienvenue ne s'affichera jamais",
        once: "Le message ne s'affiche qu'une seule fois",
        daily: "Un message par jour maximum",
        session: "À chaque fois que vous ouvrez l'application",
        connection: "À chaque fois que vous vous connectez",
        twice_daily: "Le matin (6h-12h) et l'après-midi (14h-20h)",
        hourly: "Un nouveau message toutes les heures",
      };
      return descriptions[frequency];
    },
    []
  );

  return {
    settings,
    isLoaded,
    updateFrequency,
    updateHeaderWelcome,
    shouldShowWelcome,
    markAsShown,
    resetSettings,
    getFrequencyLabel,
    getFrequencyDescription,
  };
};
