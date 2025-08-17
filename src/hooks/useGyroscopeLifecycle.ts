import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

interface GyroscopeLifecycleOptions {
  componentName?: string;
  enableLogging?: boolean;
  autoCleanup?: boolean;
}

export const useGyroscopeLifecycle = (options: GyroscopeLifecycleOptions = {}) => {
  const {
    componentName = "Component",
    enableLogging = true,
    autoCleanup = true,
  } = options;

  const isMountedRef = useRef<boolean>(true);
  const cleanupCallbacksRef = useRef<Array<() => void>>([]);

  const log = (message: string) => {
    if (enableLogging) {}
  };

  const addCleanupCallback = (callback: () => void) => {
    cleanupCallbacksRef.current.push(callback);
  };

  const executeCleanup = () => {
    log("Exécution du cleanup");
    
    cleanupCallbacksRef.current.forEach((callback, index) => {
      try {
        callback();
        log(`Cleanup callback ${index + 1} exécuté`);
      } catch (error) {}
    });
    
    cleanupCallbacksRef.current = [];
  };

  // Gérer le montage/démontage
  useEffect(() => {
    log("Composant monté");
    isMountedRef.current = true;

    return () => {
      log("Composant démonté");
      isMountedRef.current = false;
      
      if (autoCleanup) {
        executeCleanup();
      }
    };
  }, []);

  // Gérer l'état de l'application
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "inactive" || nextAppState === "background") {
        log("Application en arrière-plan - Cleanup partiel");
        
        // Cleanup partiel en arrière-plan
        cleanupCallbacksRef.current.forEach((callback, index) => {
          try {
            callback();
          } catch (error) {}
        });
      } else if (nextAppState === "active") {
        log("Application au premier plan");
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    isMounted: isMountedRef.current,
    addCleanupCallback,
    executeCleanup,
    log,
  };
};
