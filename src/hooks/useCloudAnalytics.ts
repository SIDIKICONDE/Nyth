import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useScripts } from "../contexts/ScriptsContext";
import { useHomeData } from "../components/home/useHomeData";
import analyticsService from "../services/firebase/analyticsService";
import { UserAnalytics } from "../types/analytics";

export const useCloudAnalytics = () => {
  const { user } = useAuth();
  const { scripts } = useScripts();
  const { recordings } = useHomeData();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utiliser des refs pour éviter les recalculs inutiles
  const lastScriptsLength = useRef(0);
  const lastRecordingsLength = useRef(0);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const initializeAndSubscribe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialiser les analytics si nécessaire
        await analyticsService.ensureAnalyticsExist(user.uid);

        // Ne recalculer que si c'est la première fois ou si les données ont changé
        const shouldRecalculate =
          !isInitialized.current ||
          scripts.length !== lastScriptsLength.current ||
          recordings.length !== lastRecordingsLength.current;

        if (shouldRecalculate) {
          await analyticsService.recalculateAllAnalytics(
            user.uid,
            scripts,
            recordings
          );

          lastScriptsLength.current = scripts.length;
          lastRecordingsLength.current = recordings.length;
          isInitialized.current = true;
        }

        // S'abonner aux changements en temps réel
        unsubscribe = analyticsService.subscribeToAnalytics(
          user.uid,
          (updatedAnalytics: UserAnalytics) => {
            setAnalytics(updatedAnalytics);
            setIsLoading(false);
          }
        );
      } catch (err) {
        setError("Impossible de charger les analytics");
        setIsLoading(false);
      }
    };

    initializeAndSubscribe();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, scripts.length, recordings.length]);

  const refreshAnalytics = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);

      // Forcer le recalcul
      isInitialized.current = false;
      await analyticsService.recalculateAllAnalytics(
        user.uid,
        scripts,
        recordings
      );

      lastScriptsLength.current = scripts.length;
      lastRecordingsLength.current = recordings.length;
      isInitialized.current = true;
    } catch (err) {
      setError("Erreur lors du rafraîchissement");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analytics,
    isLoading,
    error,
    refreshAnalytics,
  };
};
