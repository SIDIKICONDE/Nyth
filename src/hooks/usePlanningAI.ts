import { useMemo } from "react";
import { useGlobalPreferencesContext } from "../contexts/GlobalPreferencesContext";
import { PlanningEvent } from "../types/planning";
import { usePlanning } from "./usePlanning";

interface EventMetrics {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  overdue: number;
}

interface GoalMetrics {
  total: number;
  completed: number;
  active: number;
}

interface PlanningInsights {
  hasOverdueEvents: boolean;
  upcomingDeadlines: PlanningEvent[];
  completionRate: number;
  productiveTimeSlots: string[];
  suggestions: string[];
}

export const usePlanningAI = () => {
  const { events, goals } = usePlanning();
  const { planningPreferences } = useGlobalPreferencesContext();

  // Métriques des événements
  const eventMetrics = useMemo((): EventMetrics => {
    const now = new Date();

    return {
      total: events.length,
      completed: events.filter((e) => e.status === "completed").length,
      inProgress: events.filter((e) => e.status === "in_progress").length,
      planned: events.filter((e) => e.status === "planned").length,
      overdue: events.filter(
        (e) =>
          e.status !== "completed" &&
          e.status !== "cancelled" &&
          new Date(e.endDate) < now
      ).length,
    };
  }, [events]);

  // Métriques des objectifs
  const goalMetrics = useMemo((): GoalMetrics => {
    return {
      total: goals.length,
      completed: goals.filter((g) => g.status === "completed").length,
      active: goals.filter((g) => g.status === "active").length,
    };
  }, [goals]);

  // Insights et suggestions
  const insights = useMemo((): PlanningInsights => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const overdueEvents = events.filter(
      (e) =>
        e.status !== "completed" &&
        e.status !== "cancelled" &&
        new Date(e.endDate) < now
    );

    const upcomingDeadlines = events
      .filter(
        (e) =>
          e.status !== "completed" &&
          e.status !== "cancelled" &&
          new Date(e.endDate) >= now &&
          new Date(e.endDate) <= nextWeek
      )
      .sort(
        (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      );

    const completionRate =
      eventMetrics.total > 0
        ? (eventMetrics.completed / eventMetrics.total) * 100
        : 0;

    // Suggestions basées sur les données
    const suggestions: string[] = [];

    if (overdueEvents.length > 0) {
      suggestions.push(
        `Vous avez ${overdueEvents.length} événement(s) en retard qui nécessitent votre attention.`
      );
    }

    if (upcomingDeadlines.length > 0) {
      suggestions.push(
        `${upcomingDeadlines.length} échéance(s) approchent dans les 7 prochains jours.`
      );
    }

    if (completionRate < 70 && eventMetrics.total > 5) {
      suggestions.push(
        "Votre taux de completion est faible. Considérez réviser vos objectifs ou votre planning."
      );
    }

    if (goalMetrics.active === 0 && goalMetrics.total > 0) {
      suggestions.push(
        "Aucun objectif actif. Réactivez ou créez de nouveaux objectifs pour maintenir votre motivation."
      );
    }

    const hourlyBuckets: Record<number, number> = {};
    for (const e of events) {
      const h = new Date(e.startDate).getHours();
      hourlyBuckets[h] = (hourlyBuckets[h] || 0) + 1;
    }
    const productiveTimeSlots = Object.entries(hourlyBuckets)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3)
      .map(([h]) => `${h}:00`);

    return {
      hasOverdueEvents: overdueEvents.length > 0,
      upcomingDeadlines,
      completionRate,
      productiveTimeSlots,
      suggestions,
    };
  }, [events, goals, eventMetrics, goalMetrics]);

  // Contexte IA enrichi
  const aiContext = useMemo(() => {
    const context = `
CONTEXTE DE PLANIFICATION ACTUEL:

📊 MÉTRIQUES DES ÉVÉNEMENTS:
- Total: ${eventMetrics.total}
- Terminés: ${eventMetrics.completed}
- En cours: ${eventMetrics.inProgress}  
- Planifiés: ${eventMetrics.planned}
- En retard: ${eventMetrics.overdue}
- Taux de complétion: ${insights.completionRate.toFixed(1)}%

🎯 MÉTRIQUES DES OBJECTIFS:
- Total: ${goalMetrics.total}
- Terminés: ${goalMetrics.completed}
- Actifs: ${goalMetrics.active}

⚠️ ALERTES:
${
  insights.hasOverdueEvents
    ? `- ${eventMetrics.overdue} événement(s) en retard`
    : "- Aucun événement en retard"
}
${
  insights.upcomingDeadlines.length > 0
    ? `- ${insights.upcomingDeadlines.length} échéance(s) dans les 7 prochains jours`
    : "- Aucune échéance urgente"
}

💡 SUGGESTIONS:
${insights.suggestions.map((s) => `- ${s}`).join("\n")}

📅 ÉVÉNEMENTS RÉCENTS:
${events
  .slice(0, 5)
  .map(
    (e) =>
      `- ${e.title} (${e.status}) - ${new Date(e.endDate).toLocaleDateString()}`
  )
  .join("\n")}

🎯 OBJECTIFS ACTIFS:
${goals
  .filter((g) => g.status === "active")
  .slice(0, 3)
  .map(
    (g) => `- ${g.title}: ${g.current}/${g.target} ${g.unit} (${g.progress}%)`
  )
  .join("\n")}

PRÉFÉRENCES UTILISATEUR:
- Vue par défaut: ${planningPreferences?.defaultView || "timeline"}
- Période par défaut: ${planningPreferences?.defaultPeriod || "week"}
- Assistant IA activé: ${planningPreferences?.enableAIAssistant ? "Oui" : "Non"}
`;

    return context;
  }, [eventMetrics, goalMetrics, insights, events, goals, planningPreferences]);

  // Prompt système pour l'IA
  const systemPrompt = useMemo(() => {
    return `Tu es un assistant IA spécialisé dans la planification et la gestion de projets. Tu aides l'utilisateur à organiser ses événements, atteindre ses objectifs et optimiser sa productivité.

RÔLE:
- Analyser les données de planification de l'utilisateur
- Fournir des conseils personnalisés et des suggestions d'amélioration
- Aider à créer et organiser des événements et objectifs
- Identifier les problèmes et proposer des solutions
- Encourager et motiver l'utilisateur

CONTEXTE ACTUEL:
${aiContext}

INSTRUCTIONS:
- Base tes réponses sur les données de planification réelles de l'utilisateur
- Sois constructif et encourageant
- Propose des actions concrètes et réalisables
- Priorise les événements en retard et les échéances urgentes
- Adapte tes suggestions au style de planification de l'utilisateur
- Utilise des emojis pour rendre tes réponses plus engageantes`;
  }, [aiContext]);

  return {
    eventMetrics,
    goalMetrics,
    insights,
    aiContext,
    systemPrompt,
    // Raccourcis pour l'interface
    hasOverdueEvents: insights.hasOverdueEvents,
    upcomingDeadlines: insights.upcomingDeadlines,
    quickSuggestions: insights.suggestions.slice(0, 3),
  };
};
