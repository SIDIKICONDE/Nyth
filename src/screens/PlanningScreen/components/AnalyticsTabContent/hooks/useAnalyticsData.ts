import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { usePlanning } from "../../../../../hooks/usePlanning";
import { useTasks } from "../../../../../hooks/useTasks";
import { PlanningAnalytics } from "../../../../../types/planning";
import { LocalAnalytics, PeriodType } from "../types";

export const useAnalyticsData = () => {
  const { user } = useAuth();
  const {
    events,
    goals,
    calculateAnalytics,
    isLoading,
    error,
    refreshData,
    createEvent,
  } = usePlanning();

  const { tasks, getTaskStats } = useTasks();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("week");
  const [analytics, setAnalytics] = useState<PlanningAnalytics | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculer les analytics basiques à partir des données locales
  const localAnalytics = useMemo((): LocalAnalytics => {
    const now = new Date();

    // Filtrer les événements selon la période
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Inclure 7 jours futurs
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Fin du mois
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0); // Fin du trimestre
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31); // Fin de l'année
        break;
    }

    const periodEvents = events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate >= startDate && eventDate <= endDate;
    });

    const eventsCompleted = periodEvents.filter(
      (e) => e.status === "completed"
    ).length;
    const eventsInProgress = periodEvents.filter(
      (e) => e.status === "in_progress"
    ).length;
    const eventsPlanned = periodEvents.filter(
      (e) => e.status === "planned"
    ).length;
    const eventsOverdue = periodEvents.filter((e) => {
      const eventEnd = new Date(e.endDate);
      return (
        eventEnd < now && e.status !== "completed" && e.status !== "cancelled"
      );
    }).length;

    const isWithinPeriod = (date: Date): boolean => {
      return date >= startDate && date <= endDate;
    };

    const periodGoals = goals.filter((g) => {
      const gStart = new Date(g.startDate);
      const gEnd = new Date(g.endDate);
      return gStart <= endDate && gEnd >= startDate;
    });

    const goalsActive = periodGoals.filter((g) => g.status === "active").length;

    const goalsCompleted = periodGoals.filter((g) => {
      if (g.status !== "completed") return false;
      if (g.completedAt) {
        const completedAtDate = new Date(g.completedAt);
        return isWithinPeriod(completedAtDate);
      }
      const end = new Date(g.endDate);
      return isWithinPeriod(end);
    }).length;

    // Statistiques des tâches
    const taskStats = getTaskStats();
    const tasksCompleted = taskStats.completed;
    const tasksInProgress = taskStats.inProgress;
    const tasksTodo = taskStats.todo;
    const tasksBlocked = taskStats.blocked;
    const tasksOverdue = taskStats.overdue;
    const taskCompletionRate = taskStats.completionRate;

    const completionRate =
      periodEvents.length > 0
        ? Math.round((eventsCompleted / periodEvents.length) * 100)
        : 0;

    const goalCompletionRate =
      periodGoals.length > 0
        ? Math.round((goalsCompleted / periodGoals.length) * 100)
        : 0;

    return {
      totalEvents: periodEvents.length,
      eventsCompleted,
      eventsInProgress,
      eventsPlanned,
      eventsOverdue,
      completionRate,
      totalGoals: periodGoals.length,
      goalsCompleted,
      goalsActive,
      goalCompletionRate,
      // Données des tâches
      totalTasks: taskStats.total,
      tasksCompleted,
      tasksInProgress,
      tasksTodo,
      tasksBlocked,
      tasksOverdue,
      taskCompletionRate,
      periodEvents,
      allEvents: events.length,
    };
  }, [events, goals, tasks, selectedPeriod, getTaskStats]);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsCalculating(true);
      await calculateAnalytics(selectedPeriod);
    } catch (error) {} finally {
      setIsCalculating(false);
    }
  }, [calculateAnalytics, selectedPeriod]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    // State
    selectedPeriod,
    setSelectedPeriod,
    analytics,
    isCalculating,
    localAnalytics,

    // Data
    events,
    goals,
    tasks,
    isLoading,
    error,
    user,

    // Actions
    refreshData,
    createEvent,
  };
};
