import { createLogger } from "../../../utils/optimizedLogger";
import eventsService from "./eventsService";
import { goalsService } from "./index";
import { PlanningAnalytics, Goal } from "./types";

const logger = createLogger("AnalyticsService");

export class AnalyticsService {
  /**
   * Calculer les analytics de planification
   */
  async calculatePlanningAnalytics(
    userId: string,
    period: "week" | "month" | "quarter" | "year"
  ): Promise<PlanningAnalytics> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Récupérer les événements de la période
      const events = await eventsService.getUserEvents(userId, {
        startDate,
        endDate: now,
      });
      const goals = await goalsService.getUserGoals(userId);

      const periodGoals: Goal[] = goals.filter((g: Goal) => {
        const gStart = new Date(g.startDate);
        const gEnd = new Date(g.endDate);
        return gStart <= now && gEnd >= startDate;
      });

      const isWithinPeriod = (date: Date): boolean => {
        return date >= startDate && date <= now;
      };

      // Calculer les métriques
      const eventsCompleted = events.filter(
        (e: any) => e.status === "completed"
      ).length;
      const eventsPlanned = events.length;
      const completionRate =
        eventsPlanned > 0 ? (eventsCompleted / eventsPlanned) * 100 : 0;

      const goalsActive = periodGoals.filter(
        (g: Goal) => g.status === "active"
      ).length;
      const goalsCompleted = periodGoals.filter((g: Goal) => {
        if (g.status !== "completed") return false;
        if (g.completedAt) {
          return isWithinPeriod(new Date(g.completedAt));
        }
        return isWithinPeriod(new Date(g.endDate));
      }).length;
      const goalCompletionRate =
        periodGoals.length > 0
          ? (goalsCompleted / periodGoals.length) * 100
          : 0;

      const plannedHours =
        events.reduce(
          (sum: any, e: any) => sum + (e.estimatedDuration || 0),
          0
        ) / 60;
      const actualHours =
        events.reduce((sum: any, e: any) => sum + (e.actualDuration || 0), 0) /
        60;
      const efficiencyRate =
        plannedHours > 0 ? (actualHours / plannedHours) * 100 : 0;

      const trends = [
        {
          metric: "completionRate",
          period: period,
          value: Math.round(completionRate),
          change: 0,
          direction: "stable" as const,
        },
      ];

      const insights = [] as PlanningAnalytics["insights"];
      if (completionRate < 50 && eventsPlanned > 5) {
        insights.push({
          type: "warning",
          title: "Taux de complétion faible",
          description:
            "Réévaluez la charge prévue ou fractionnez les tâches pour améliorer la progression.",
          actionable: true,
          action: "open_planning_tips",
          priority: "high",
        });
      }
      if (goalsActive === 0 && goals.length > 0) {
        insights.push({
          type: "suggestion",
          title: "Aucun objectif actif",
          description:
            "Réactivez un objectif pour maintenir l'élan et le suivi.",
          actionable: true,
          action: "reactivate_goal",
          priority: "medium",
        });
      }

      const analytics: PlanningAnalytics = {
        userId,
        period,
        eventsCompleted,
        eventsPlanned,
        completionRate,
        goalsActive,
        goalsCompleted,
        goalCompletionRate,
        tasksCompleted: 0,
        tasksActive: 0,
        taskCompletionRate: 0,
        averageTaskDuration: 0,
        plannedHours,
        actualHours,
        efficiencyRate,
        trends,
        insights,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return analytics;
    } catch (error) {
      logger.error("Erreur lors du calcul des analytics:", error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
