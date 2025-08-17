import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";

const SESSION_STORAGE_KEY = "userSessions";
const ACTIVE_DAY_MIN_DURATION = 60; // 1 minute minimum pour considérer un jour comme actif
const ACTIVE_DAY_MAX_DURATION = 300; // 5 minutes pour être sûr d'être actif

interface SessionData {
  date: string; // Format: YYYY-MM-DD
  totalTime: number; // en secondes
  sessions: {
    start: string;
    end?: string;
    duration?: number;
  }[];
  isActiveDay: boolean;
}

interface SessionStats {
  activeDays: number;
  totalSessions: number;
  averageSessionTime: number;
  longestSession: number;
  firstActiveDate?: string;
}

export const useSessionTracker = () => {
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    activeDays: 0,
    totalSessions: 0,
    averageSessionTime: 0,
    longestSession: 0,
  });

  const sessionStartTime = useRef<Date | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Charger les statistiques de session
  const loadSessionStats = async (): Promise<SessionStats> => {
    try {
      const savedSessions = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (!savedSessions) {
        return {
          activeDays: 0,
          totalSessions: 0,
          averageSessionTime: 0,
          longestSession: 0,
        };
      }

      const sessions: Record<string, SessionData> = JSON.parse(savedSessions);
      const activeDays = Object.values(sessions).filter(
        (day) => day.isActiveDay
      ).length;
      const allSessions = Object.values(sessions).flatMap(
        (day) => day.sessions
      );
      const validSessions = allSessions.filter(
        (session) => session.duration && session.duration > 0
      );

      const totalSessions = validSessions.length;
      const totalTime = validSessions.reduce(
        (sum, session) => sum + (session.duration || 0),
        0
      );
      const averageSessionTime =
        totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;
      const longestSession = validSessions.reduce(
        (max, session) => Math.max(max, session.duration || 0),
        0
      );

      // Trouver la première date d'activité
      const activeDates = Object.keys(sessions)
        .filter((date) => sessions[date].isActiveDay)
        .sort();
      const firstActiveDate =
        activeDates.length > 0 ? activeDates[0] : undefined;

      return {
        activeDays,
        totalSessions,
        averageSessionTime,
        longestSession,
        firstActiveDate,
      };
    } catch (error) {
      return {
        activeDays: 0,
        totalSessions: 0,
        averageSessionTime: 0,
        longestSession: 0,
      };
    }
  };

  // Sauvegarder une session
  const saveSession = async (duration: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      const savedSessions = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      const sessions: Record<string, SessionData> = savedSessions
        ? JSON.parse(savedSessions)
        : {};

      if (!sessions[today]) {
        sessions[today] = {
          date: today,
          totalTime: 0,
          sessions: [],
          isActiveDay: false,
        };
      }

      // Ajouter la nouvelle session
      sessions[today].sessions.push({
        start: new Date(Date.now() - duration * 1000).toISOString(),
        end: now,
        duration: duration,
      });

      // Mettre à jour le temps total
      sessions[today].totalTime += duration;

      // Déterminer si c'est un jour actif (entre 1 et 5 minutes minimum)
      sessions[today].isActiveDay =
        sessions[today].totalTime >= ACTIVE_DAY_MIN_DURATION;

      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));

      // Recharger les stats
      const newStats = await loadSessionStats();
      setSessionStats(newStats);
    } catch (error) {}
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
        await saveSession(duration);
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

    // Charger les stats au démarrage
    loadSessionStats().then(setSessionStats);

    return () => {
      subscription?.remove();
      // Terminer la session en cours si elle existe
      if (sessionStartTime.current) {
        endSession();
      }
    };
  }, []);

  // Fonction pour obtenir le nombre de jours actifs
  const getActiveDays = () => sessionStats.activeDays;

  // Fonction pour vérifier si aujourd'hui est un jour actif
  const isTodayActive = async (): Promise<boolean> => {
    const today = new Date().toISOString().split("T")[0];
    const savedSessions = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

    if (!savedSessions) return false;

    const sessions: Record<string, SessionData> = JSON.parse(savedSessions);
    return sessions[today]?.isActiveDay || false;
  };

  // Réinitialiser les sessions (pour debug)
  const resetSessions = async () => {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionStats({
      activeDays: 0,
      totalSessions: 0,
      averageSessionTime: 0,
      longestSession: 0,
    });
  };

  return {
    sessionStats,
    getActiveDays,
    isTodayActive,
    resetSessions,
    startSession,
    endSession,
  };
};
