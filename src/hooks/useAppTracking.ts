import { useEffect } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { userActivityService } from "../services/userActivityService";

export const useAppTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.isGuest) return;

    // Tracker l'ouverture initiale de l'app
    const trackInitialOpen = async () => {
      try {
        const deviceInfo = {
          platform: Platform.OS,
          version: Platform.Version?.toString(),
        };
        await userActivityService.trackAppOpen(user.uid, deviceInfo);
      } catch (error) {}
    };

    trackInitialOpen();

    // Écouter les changements d'état de l'app
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // L'app revient au premier plan
        trackInitialOpen();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [user]);
};
