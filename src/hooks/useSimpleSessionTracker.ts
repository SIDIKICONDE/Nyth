import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DAILY_SESSIONS_KEY = "dailySessions";
const MIN_SESSION_TIME = 60; // 1 minute minimum pour compter comme jour actif

interface DailySession {
  date: string; // Format: YYYY-MM-DD
  totalTime: number; // en secondes
  isActive: boolean; // true si >= 1 minute
}

export const useSimpleSessionTracker = () => {
  const sessionStartTime = useRef<Date | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Sauvegarder le temps de session d'aujourd'hui
  const saveSessionTime = async (duration: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const savedSessions = await AsyncStorage.getItem(DAILY_SESSIONS_KEY);
      const sessions: Record<string, DailySession> = savedSessions
        ? JSON.parse(savedSessions)
        : {};

      if (!sessions[today]) {
        sessions[today] = {
          date: today,
          totalTime: 0,
          isActive: false,
        };
      }

      // Ajouter le temps de cette session
      sessions[today].totalTime += duration;

      // Marquer comme actif si >= 1 minute
      sessions[today].isActive = sessions[today].totalTime >= MIN_SESSION_TIME;

      await AsyncStorage.setItem(DAILY_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {}
  };

  // Obtenir le nombre de jours actifs
  const getActiveDaysCount = async (): Promise<number> => {
    try {
      const savedSessions = await AsyncStorage.getItem(DAILY_SESSIONS_KEY);
      if (!savedSessions) return 0;

      const sessions: Record<string, DailySession> = JSON.parse(savedSessions);
      const activeDays = Object.values(sessions).filter(
        (session) => session.isActive
      );

      return activeDays.length;
    } catch (error) {
      return 0;
    }
  };

  // Démarrer une session
  const startSession = () => {
    sessionStartTime.current = new Date();
  };

  // Terminer une session
  const endSession = async () => {
    if (sessionStartTime.current) {
      const duration = Math.round(
        (Date.now() - sessionStartTime.current.getTime()) / 1000
      );

      // Sauvegarder seulement si la session dure plus de 10 secondes
      if (duration >= 10) {
        await saveSessionTime(duration);
      }

      sessionStartTime.current = null;
    }
  };

  // Gérer les changements d'état de l'app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App devient active
        startSession();
      } else if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // App devient inactive
        endSession();
      }
      appStateRef.current = nextAppState;
    };

    // Démarrer une session si l'app est déjà active
    if (AppState.currentState === "active") {
      startSession();
    }

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
      // Terminer la session en cours si elle existe
      if (sessionStartTime.current) {
        endSession();
      }
    };
  }, []);

  return {
    getActiveDaysCount,
  };
};
