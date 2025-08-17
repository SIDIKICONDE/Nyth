import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "../../hooks/useTranslation";
import { createLogger } from "../../utils/optimizedLogger";
import { AppHandlers } from "./types";

const logger = createLogger("AppHandlers");

interface UseAppHandlersProps {
  setHasPermissions: (granted: boolean) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setIsInitialLoading: (loading: boolean) => void;
  hasCompletedOnboarding: boolean;
  hasPermissions: boolean;
}

export const useAppHandlers = ({
  setHasPermissions,
  setHasCompletedOnboarding,
  setIsInitialLoading,
  hasCompletedOnboarding,
  hasPermissions,
}: UseAppHandlersProps): AppHandlers => {
  const { t } = useTranslation();

  const handlePermissionsComplete = async () => {
    await AsyncStorage.setItem("permissionsStatus", "granted");
    setHasPermissions(true);
  };

  const handleUserConnectedSkipOnboarding = async () => {
    try {
      logger.info("Connected user detected - Onboarding already disabled");
      // L'onboarding est désormais toujours ignoré
      
      if (!hasPermissions) {
        await AsyncStorage.setItem("permissionsStatus", "granted");
        setHasPermissions(true);
      }
    } catch (error) {
      logger.error("Error setting permissions for connected user", error);
    }
  };

  const checkAppStatus = async () => {
    try {
      const [onboardingStatus, permissionsStatus] = await Promise.all([
        AsyncStorage.getItem("hasCompletedOnboarding"),
        AsyncStorage.getItem("permissionsRequested"),
      ]);

      logger.debug("Application status", {
        onboarding: onboardingStatus,
        permissions: permissionsStatus,
      });

      setHasCompletedOnboarding(onboardingStatus === "true");
      setHasPermissions(permissionsStatus === "true");
    } catch (error) {
      logger.error("Error checking app status", error);
    }
  };

  return {
    handlePermissionsComplete,
    handleUserConnectedSkipOnboarding,
    checkAppStatus,
  };
};
