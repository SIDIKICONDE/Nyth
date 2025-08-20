import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { createLogger } from "../../utils/optimizedLogger";
import { AppActions, AppState } from "./types";

const logger = createLogger("AppState");

export const useAppState = (): AppState & AppActions => {
  const [isLoading, setIsLoading] = useState(false); // Loading désactivé
  const [isInitialLoading, setIsInitialLoading] = useState(false); // Loading initial désactivé
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true); // Onboarding désactivé par défaut
  const [hasPermissions, setHasPermissions] = useState(false);
  const [appResetCounter, setAppResetCounter] = useState(0);

  // Load app status from AsyncStorage
  const checkAppStatus = async () => {
    try {
      // Forcer l'onboarding à terminé et le sauvegarder
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");

      const permissionsStatus = await AsyncStorage.getItem(
        "permissionsRequested"
      );

      logger.debug("Statut de l'application", {
        onboarding: "true (forcé)",
        permissions: permissionsStatus,
      });

      setHasCompletedOnboarding(true); // Force l'onboarding à terminé
      setHasPermissions(permissionsStatus === "true");
    } catch (error) {
      logger.error("Erreur lors de la vérification du statut de l'app", error);
    }
    // Plus besoin de setIsLoading(false) car il démarre à false
  };

  // Initialize app state
  useEffect(() => {
    checkAppStatus();
  }, []);

  return {
    // State
    isLoading,
    isInitialLoading,
    hasCompletedOnboarding,
    hasPermissions,
    appResetCounter,

    // Actions
    setIsLoading,
    setIsInitialLoading,
    setHasCompletedOnboarding,
    setHasPermissions,
    setAppResetCounter,
  };
};
