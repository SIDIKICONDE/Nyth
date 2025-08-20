import { useEffect, useState } from "react";
import { Appearance, Platform } from "react-native";

export type SystemTheme = "light" | "dark";

/**
 * Détecte le thème système sur Windows
 */
const getWindowsTheme = (): SystemTheme => {
  try {
    // Méthode 1: CSS media query (pour l'environnement web/Windows)
    if (typeof window !== "undefined" && window.matchMedia) {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return isDark ? "dark" : "light";
    }

    // Méthode 2: Vérifier les variables d'environnement Windows
    if (typeof process !== "undefined" && process.env) {
      // Windows stocke parfois le thème dans les variables d'environnement
      const windowsTheme =
        process.env.WINDOWS_THEME || process.env.SystemUsesLightTheme;
      if (windowsTheme === "dark" || windowsTheme === "0") {
        return "dark";
      }
      if (windowsTheme === "light" || windowsTheme === "1") {
        return "light";
      }
    }

    // Méthode 3: Heure du jour comme fallback intelligent
    const hour = new Date().getHours();
    return hour >= 18 || hour < 7 ? "dark" : "light";
  } catch (error) {
    return "light";
  }
};

/**
 * Détecte si on est sur Windows
 */
const isWindows = (): boolean => {
  // Vérifier Platform.OS
  if (Platform.OS === "windows" || (Platform.OS as string) === "win32") {
    return true;
  }

  // Vérifier process.platform (Node.js)
  if (typeof process !== "undefined" && process.platform === "win32") {
    return true;
  }

  // Vérifier navigator.platform (web)
  if (typeof navigator !== "undefined" && navigator.platform) {
    return navigator.platform.toLowerCase().includes("win");
  }

  // Vérifier les variables d'environnement Windows
  if (typeof process !== "undefined" && process.env) {
    return !!(
      process.env.WINDIR ||
      process.env.SYSTEMROOT ||
      process.env.OS === "Windows_NT"
    );
  }

  return false;
};

/**
 * Hook pour détecter et suivre le thème système (iOS, Android, Windows)
 */
export const useSystemTheme = () => {
  const [systemTheme, setSystemTheme] = useState<SystemTheme>(() => {
    // Détecter le thème initial selon la plateforme
    if (isWindows()) {
      return getWindowsTheme();
    } else {
      // iOS/Android - utiliser l'API Appearance
      const colorScheme = Appearance.getColorScheme();
      return colorScheme === "dark" ? "dark" : "light";
    }
  });

  useEffect(() => {
    if (isWindows()) {
      // Pour Windows - écouter les changements via CSS media query
      if (typeof window !== "undefined" && window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = (e: MediaQueryListEvent) => {
          const newTheme = e.matches ? "dark" : "light";
          setSystemTheme(newTheme);
        };

        // Écouter les changements
        mediaQuery.addEventListener("change", handleChange);

        // Nettoyer à la fin
        return () => {
          mediaQuery.removeEventListener("change", handleChange);
        };
      } else {
        // Fallback: vérifier périodiquement (toutes les 30 secondes)
        const interval = setInterval(() => {
          const newTheme = getWindowsTheme();
          if (newTheme !== systemTheme) {
            setSystemTheme(newTheme);
          }
        }, 30000);

        return () => clearInterval(interval);
      }
    } else {
      // iOS/Android - utiliser l'API Appearance native
      const listener = (preferences: {
        colorScheme: "light" | "dark" | null | undefined;
      }) => {
        const newTheme = preferences.colorScheme === "dark" ? "dark" : "light";
        setSystemTheme(newTheme);
      };

      // S'abonner aux changements
      const subscription = Appearance.addChangeListener(listener);

      // Nettoyer l'abonnement au démontage
      return () => {
        subscription?.remove();
      };
    }
  }, [systemTheme]);

  return {
    systemTheme,
    isSystemDark: systemTheme === "dark",
    isSystemLight: systemTheme === "light",
    platform: isWindows() ? "windows" : Platform.OS,
  };
};
