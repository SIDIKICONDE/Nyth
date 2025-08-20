import { useMemo } from "react";
import { useCloudAnalytics } from "../../../../../hooks/useCloudAnalytics";
import { Analytics } from "../types/analytics";

export const useProfileAnalytics = (): Analytics => {
  const { analytics: cloudAnalytics, isLoading, error } = useCloudAnalytics();

  const analytics = useMemo(() => {
    // Si les analytics cloud ne sont pas encore chargées, retourner des valeurs par défaut
    if (!cloudAnalytics || error) {
      return {
        avgRecordingTime: 0,
        activityByDay: [],
        maxActivity: 1,
        hourlyActivity: [],
        peakHour: { hour: 0, count: 0 },
        totalDays: 0,
        thisWeekTotal: 0,
        weekTrend: 0,
        productivity: "0",
      };
    }

    // Convertir les données du cloud vers le format attendu par les composants
    const avgRecordingTime = cloudAnalytics.avgRecordingTime;

    // Créer les données d'activité pour les 7 derniers jours
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const activityByDay = last7Days.map((dateStr) => {
      const activity = cloudAnalytics.weeklyStats.dailyActivity[dateStr];
      const date = new Date(dateStr);

      return {
        date,
        day: date.toLocaleDateString("fr-FR", { weekday: "short" }),
        scripts: activity?.scripts || 0,
        recordings: activity?.recordings || 0,
        total: (activity?.scripts || 0) + (activity?.recordings || 0),
      };
    });

    // Calculer le max pour l'échelle du graphique
    const maxActivity =
      activityByDay.length > 0
        ? Math.max(...activityByDay.map((d) => d.total), 1)
        : 1;

    // Convertir la distribution horaire en tableau
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: cloudAnalytics.hourlyDistribution[hour] || 0,
    }));

    const peakHour =
      hourlyActivity.length > 0
        ? hourlyActivity.reduce(
            (max, curr) => (curr.count > max.count ? curr : max),
            hourlyActivity[0]
          )
        : { hour: 0, count: 0 };

    return {
      avgRecordingTime,
      activityByDay,
      maxActivity,
      hourlyActivity,
      peakHour,
      totalDays: Math.ceil(
        (Date.now() - new Date(cloudAnalytics.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      thisWeekTotal: cloudAnalytics.weeklyStats.thisWeekTotal,
      weekTrend: cloudAnalytics.weeklyStats.weekTrend,
      productivity: cloudAnalytics.productivity.toFixed(1),
    };
  }, [cloudAnalytics]);

  return analytics;
};
