import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { gamificationService } from "../services/gamificationService";
import {
  Challenge,
  GamificationStats,
  Mission,
  Streak,
} from "../types/achievements";

export const useGamification = () => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState<{
    pointsEarned: number;
    xpEarned: number;
    message?: string;
  } | null>(null);

  const { user } = useAuth();

  // Initialiser le service
  useEffect(() => {
    const initializeService = async () => {
      if (user) {
        setLoading(true);
        try {
          await gamificationService.initialize(user.uid);
          await loadAllData();
        } catch (error) {} finally {
          setLoading(false);
        }
      }
    };

    initializeService();
  }, [user?.uid]);

  // Charger toutes les données
  const loadAllData = useCallback(async () => {
    try {
      const [statsData, challengesData, missionsData, streaksData] =
        await Promise.all([
          gamificationService.getStats(),
          gamificationService.getActiveChallenges(),
          gamificationService.getActiveMissions(),
          gamificationService.getStreaks(),
        ]);

      setStats(statsData);
      setChallenges(challengesData);
      setMissions(missionsData);
      setStreaks(streaksData);
    } catch (error) {}
  }, []);

  // Enregistrer une action
  const recordAction = useCallback(
    async (actionId: string, metadata?: any) => {
      try {
        const result = await gamificationService.recordAction(
          actionId,
          metadata
        );
        setLastAction(result);

        // Recharger les données pour refléter les changements
        await loadAllData();

        // Effacer le message après 5 secondes
        setTimeout(() => setLastAction(null), 5000);

        return result;
      } catch (error) {
        return { pointsEarned: 0, xpEarned: 0, multiplier: 1 };
      }
    },
    [loadAllData]
  );

  // Mettre à jour un streak
  const updateStreak = useCallback(async (type: Streak["type"]) => {
    try {
      await gamificationService.updateStreak(type);
      const updatedStreaks = await gamificationService.getStreaks();
      setStreaks(updatedStreaks);
    } catch (error) {}
  }, []);

  // Charger le classement
  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await gamificationService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {}
  }, []);

  // Rafraîchir les défis (vérifier expiration)
  const refreshChallenges = useCallback(async () => {
    try {
      const updatedChallenges = await gamificationService.getActiveChallenges();
      setChallenges(updatedChallenges);
    } catch (error) {}
  }, []);

  // Obtenir les défis quotidiens
  const getDailyChallenges = useCallback(() => {
    return challenges.filter((c) => c.type === "daily");
  }, [challenges]);

  // Obtenir les défis hebdomadaires
  const getWeeklyChallenges = useCallback(() => {
    return challenges.filter((c) => c.type === "weekly");
  }, [challenges]);

  // Obtenir les missions actives non complétées
  const getActiveMissions = useCallback(() => {
    return missions.filter((m) => m.isActive && !m.isCompleted);
  }, [missions]);

  // Obtenir les missions complétées
  const getCompletedMissions = useCallback(() => {
    return missions.filter((m) => m.isCompleted);
  }, [missions]);

  // Calculer le pourcentage de progression globale
  const getOverallProgress = useCallback(() => {
    if (!stats) return 0;

    const totalPossible =
      stats.totalAchievements + missions.length + challenges.length;

    const totalCompleted =
      stats.achievementsUnlocked +
      stats.completedMissions +
      stats.completedChallenges;

    return totalPossible > 0
      ? Math.round((totalCompleted / totalPossible) * 100)
      : 0;
  }, [stats, missions, challenges]);

  // Obtenir le streak le plus long actuel
  const getLongestCurrentStreak = useCallback(() => {
    if (streaks.length === 0) return 0;
    return Math.max(...streaks.map((s) => s.currentStreak));
  }, [streaks]);

  // Obtenir le meilleur streak historique
  const getBestStreak = useCallback(() => {
    if (streaks.length === 0) return 0;
    return Math.max(...streaks.map((s) => s.longestStreak));
  }, [streaks]);

  // Vérifier si un nouveau niveau a été atteint
  const checkLevelUp = useCallback((oldXP: number, newXP: number) => {
    const oldLevel = Math.floor(Math.sqrt(oldXP / 100)) + 1;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
    return newLevel > oldLevel;
  }, []);

  // Obtenir les récompenses en attente
  const getPendingRewards = useCallback(() => {
    const rewards: Array<{
      type: "challenge" | "mission";
      name: string;
      xp: number;
      points: number;
    }> = [];

    // Défis complétés non réclamés
    const completedChallenges = challenges.filter((c) => c.isCompleted);
    completedChallenges.forEach((c) => {
      rewards.push({
        type: "challenge",
        name: c.name,
        xp: c.xpReward,
        points: c.pointsReward,
      });
    });

    // Missions complétées récentes
    const recentMissions = missions.filter(
      (m) =>
        m.isCompleted &&
        m.completedAt &&
        new Date(m.completedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    recentMissions.forEach((m) => {
      rewards.push({
        type: "mission",
        name: m.name,
        xp: m.totalXpReward,
        points: m.totalPointsReward,
      });
    });

    return rewards;
  }, [challenges, missions]);

  return {
    // État
    stats,
    challenges,
    missions,
    streaks,
    leaderboard,
    loading,
    lastAction,

    // Actions
    recordAction,
    updateStreak,
    loadLeaderboard,
    refreshChallenges,
    loadAllData,

    // Getters
    getDailyChallenges,
    getWeeklyChallenges,
    getActiveMissions,
    getCompletedMissions,
    getOverallProgress,
    getLongestCurrentStreak,
    getBestStreak,
    checkLevelUp,
    getPendingRewards,
  };
};
