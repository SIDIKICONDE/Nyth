import AsyncStorage from "@react-native-async-storage/async-storage";
import eventsService from "./eventsService";
import { goalsService } from "./goalsService";
import { ExtendedNotificationSettings } from "../../../components/planning/settings/types";

/**
 * Charge les paramètres de notification depuis le stockage local
 */
const loadNotificationSettings =
  async (): Promise<ExtendedNotificationSettings | null> => {
    try {
      const savedSettings = await AsyncStorage.getItem(
        "@planning_notification_settings"
      );
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

/**
 * Analyse les habitudes de notification de l'utilisateur
 */
const analyzeNotificationHabits = (
  events: any[],
  goals: any[],
  notificationSettings: ExtendedNotificationSettings | null
) => {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Événements récents avec leurs horaires
  const recentEvents = events.filter((e) => new Date(e.createdAt) >= lastWeek);

  // Analyser les patterns temporels
  const eventsByHour = recentEvents.reduce((acc, event) => {
    const hour = new Date(event.startDate).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Heures les plus actives
  const mostActiveHours = Object.entries(eventsByHour)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Analyser la complétion des événements
  const completionRate =
    events.length > 0
      ? (events.filter((e) => e.status === "completed").length /
          events.length) *
        100
      : 0;

  // Analyser les retards
  const overdueEvents = events.filter(
    (e) =>
      e.status !== "completed" &&
      e.status !== "cancelled" &&
      new Date(e.endDate) < now
  );

  return {
    mostActiveHours,
    completionRate,
    overdueCount: overdueEvents.length,
    recentActivityLevel: recentEvents.length,
    needsMoreReminders: completionRate < 70 && overdueEvents.length > 2,
    suggestedReminderTimes:
      mostActiveHours.length > 0 ? mostActiveHours : [9, 14, 18], // défaut matin, après-midi, soir
  };
};

/**
 * Génère le contexte de notification pour l'IA
 */
const generateNotificationContext = (
  notificationSettings: ExtendedNotificationSettings | null,
  habits: any
): string => {
  if (!notificationSettings) {
    return `- Paramètres de notification non configurés
- Seules les notifications PUSH sont disponibles (Email/SMS non implémentés)
- L'IA peut suggérer une configuration optimale basée sur les habitudes de l'utilisateur
- Heures suggérées pour les rappels: ${habits.suggestedReminderTimes.join(
      "h, "
    )}h
- Besoin de plus de rappels: ${
      habits.needsMoreReminders ? "Oui" : "Non"
    } (taux complétion: ${habits.completionRate.toFixed(1)}%)`;
  }

  const smartFeatures = [];
  if (notificationSettings.smartNotifications?.enabled) {
    if (notificationSettings.smartNotifications.aiSuggestions)
      smartFeatures.push("Suggestions IA");
    if (notificationSettings.smartNotifications.habitBasedReminders)
      smartFeatures.push("Rappels adaptatifs");
    if (notificationSettings.smartNotifications.productivityInsights)
      smartFeatures.push("Insights productivité");
  }

  const activeReminders = [];
  if (notificationSettings.eventReminders?.enabled) {
    activeReminders.push(
      `Événements (${notificationSettings.eventReminders.defaultTiming.join(
        ", "
      )} min avant)`
    );
  }
  if (notificationSettings.goalReminders?.enabled) {
    const goalFeatures = [];
    if (notificationSettings.goalReminders.dailyProgress)
      goalFeatures.push("progrès quotidien");
    if (notificationSettings.goalReminders.weeklyReview)
      goalFeatures.push("révision hebdomadaire");
    if (notificationSettings.goalReminders.overdueAlerts)
      goalFeatures.push("alertes retard");
    activeReminders.push(`Objectifs (${goalFeatures.join(", ")})`);
  }
  if (notificationSettings.taskReminders?.enabled) {
    activeReminders.push("Tâches activés");
  }

  return `- Notifications configurées: ${
    notificationSettings.pushNotifications
      ? "Push (actives)"
      : "Push (désactivées)"
  } ${
    notificationSettings.emailNotifications
      ? "Email (configuré mais non implémenté)"
      : ""
  } ${
    notificationSettings.smsNotifications
      ? "SMS (configuré mais non implémenté)"
      : ""
  }
- Rappels actifs: ${
    activeReminders.length > 0 ? activeReminders.join(", ") : "Aucun"
  }
- Fonctionnalités IA: ${
    smartFeatures.length > 0 ? smartFeatures.join(", ") : "Désactivées"
  }
- Mode tranquillité: ${
    notificationSettings.quietHours?.enabled
      ? `${notificationSettings.quietHours.startTime}-${notificationSettings.quietHours.endTime}`
      : "Désactivé"
  }
- Habitudes détectées: Actif aux heures ${habits.mostActiveHours.join("h, ")}h
- Taux de complétion: ${habits.completionRate.toFixed(1)}% (${
    habits.overdueCount
  } en retard)
- Niveau d'activité récent: ${
    habits.recentActivityLevel
  } événements cette semaine
- L'IA peut optimiser les rappels selon ces habitudes et suggérer des améliorations`;
};

/**
 * Obtient le contexte de planification pour l'IA
 */
export const getPlanningContextForAI = async (
  userId: string
): Promise<string> => {
  try {
    const [events, goals, notificationSettings] = await Promise.all([
      eventsService.getUserEvents(userId),
      goalsService.getUserGoals(userId),
      loadNotificationSettings(),
    ]);

    const now = new Date();

    // Analyser les habitudes de notification de l'utilisateur
    const notificationHabits = analyzeNotificationHabits(
      events,
      goals,
      notificationSettings
    );

    // Métriques des événements
    const eventMetrics = {
      total: events.length,
      completed: events.filter((e: any) => e.status === "completed").length,
      inProgress: events.filter((e: any) => e.status === "in_progress").length,
      planned: events.filter((e: any) => e.status === "planned").length,
      overdue: events.filter(
        (e: any) =>
          e.status !== "completed" &&
          e.status !== "cancelled" &&
          new Date(e.endDate) < now
      ).length,
    };

    // Métriques des objectifs
    const goalMetrics = {
      total: goals.length,
      completed: goals.filter((g: any) => g.status === "completed").length,
      active: goals.filter((g: any) => g.status === "active").length,
    };

    // Événements en retard
    const overdueEvents = events.filter(
      (e: any) =>
        e.status !== "completed" &&
        e.status !== "cancelled" &&
        new Date(e.endDate) < now
    );

    // Échéances dans les 7 prochains jours
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingDeadlines = events.filter(
      (e: any) =>
        e.status !== "completed" &&
        e.status !== "cancelled" &&
        new Date(e.endDate) >= now &&
        new Date(e.endDate) <= nextWeek
    );

    const completionRate =
      eventMetrics.total > 0
        ? (eventMetrics.completed / eventMetrics.total) * 100
        : 0;

    // Suggestions
    const suggestions: string[] = [];

    if (overdueEvents.length > 0) {
      suggestions.push(
        `${overdueEvents.length} événement(s) en retard nécessitent votre attention`
      );
    }

    if (upcomingDeadlines.length > 0) {
      suggestions.push(
        `${upcomingDeadlines.length} échéance(s) approchent dans les 7 prochains jours`
      );
    }

    if (completionRate < 70 && eventMetrics.total > 5) {
      suggestions.push(
        "Taux de complétion faible, révision du planning recommandée"
      );
    }

    if (goalMetrics.active === 0 && goalMetrics.total > 0) {
      suggestions.push("Aucun objectif actif, réactivation recommandée");
    }

    // Construire le contexte
    const context = `
📅 CONTEXTE DE PLANIFICATION (ÉVÉNEMENTS & OBJECTIFS):

IMPORTANT: Ces données concernent uniquement les ÉVÉNEMENTS DE PLANIFICATION (réunions, tâches, rendez-vous) et les OBJECTIFS de productivité. 
Ne pas confondre avec les scripts vidéo qui sont une fonctionnalité différente de l'application.

📊 STATISTIQUES DES ÉVÉNEMENTS DE PLANIFICATION:
- Total d'événements créés: ${eventMetrics.total}
- Événements terminés: ${eventMetrics.completed}
- Événements en cours: ${eventMetrics.inProgress}
- Événements planifiés: ${eventMetrics.planned}
- Événements en retard: ${eventMetrics.overdue}
- Taux de complétion: ${completionRate.toFixed(1)}%

🎯 STATISTIQUES DES OBJECTIFS:
- Total d'objectifs: ${goalMetrics.total}
- Objectifs terminés: ${goalMetrics.completed}
- Objectifs actifs: ${goalMetrics.active}

⚠️ ALERTES DE PLANIFICATION:
${
  overdueEvents.length > 0
    ? `- ${eventMetrics.overdue} événement(s) en retard`
    : "- Aucun événement en retard"
}
${
  upcomingDeadlines.length > 0
    ? `- ${upcomingDeadlines.length} échéance(s) dans les 7 prochains jours`
    : "- Aucune échéance urgente"
}

💡 SUGGESTIONS DE PLANIFICATION:
${
  suggestions.length > 0
    ? suggestions.map((s) => `- ${s}`).join("\n")
    : "- Aucune suggestion particulière"
}

📅 ÉVÉNEMENTS RÉCENTS (planification):
${events
  .slice(0, 5)
  .map(
    (e: any) =>
      `- ${e.title} (${e.status}) - ${new Date(e.endDate).toLocaleDateString()}`
  )
  .join("\n")}

🎯 OBJECTIFS ACTIFS:
${goals
  .filter((g: any) => g.status === "active")
  .slice(0, 3)
  .map(
    (g: any) =>
      `- ${g.title}: ${g.current}/${g.target} ${g.unit} (${g.progress}%)`
  )
  .join("\n")}

RAPPEL: Quand l'utilisateur demande des informations sur ses "événements", il fait référence à ses événements de PLANIFICATION (réunions, tâches, etc.), pas aux scripts vidéo.

🔔 CONTEXTE NOTIFICATIONS INTELLIGENTES:
${generateNotificationContext(notificationSettings, notificationHabits)}
`;

    return context.trim();
  } catch (error) {
    return `📅 CONTEXTE DE PLANIFICATION:
L'utilisateur utilise le système de planification de l'application pour organiser ses événements et objectifs.
Tu peux l'aider avec la gestion du temps, la priorisation des tâches, et l'optimisation de sa productivité.`;
  }
};

/**
 * Obtient le contexte des vidéos pour l'IA
 */
export const getVideosContextForAI = async (user: any): Promise<string> => {
  try {
    if (!user) {
      return `📹 CONTEXTE VIDÉOS:
L'utilisateur n'est pas connecté, impossible d'accéder aux vidéos.`;
    }

    // Importer le service de stockage unifié
    const unifiedStorageService = (await import("../unifiedStorageService"))
      .default;

    // Récupérer les vidéos et scripts
    const [recordings, scripts] = await Promise.all([
      unifiedStorageService.getRecordings(user),
      unifiedStorageService.getScripts(user),
    ]);

    // Calculer les métriques des vidéos
    const videoMetrics = {
      total: recordings.length,
      withScript: recordings.filter((r) => r.scriptId).length,
      withoutScript: recordings.filter((r) => !r.scriptId).length,
      totalDuration: recordings.reduce((sum, r) => sum + (r.duration || 0), 0),
      averageDuration:
        recordings.length > 0
          ? Math.round(
              recordings.reduce((sum, r) => sum + (r.duration || 0), 0) /
                recordings.length
            )
          : 0,
    };

    // Calculer les métriques des scripts
    const scriptMetrics = {
      total: scripts.length,
      used: scripts.filter((s) => recordings.some((r) => r.scriptId === s.id))
        .length,
      unused: scripts.filter(
        (s) => !recordings.some((r) => r.scriptId === s.id)
      ).length,
    };

    // Formatage de la durée totale
    const formatDuration = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}min ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}min ${secs}s`;
      } else {
        return `${secs}s`;
      }
    };

    // Vidéos récentes (5 dernières)
    const recentVideos = recordings
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    // Scripts récents (5 derniers)
    const recentScripts = scripts
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )
      .slice(0, 5);

    // Construire le contexte
    const context = `
📹 CONTEXTE VIDÉOS & SCRIPTS:

IMPORTANT: Ces données concernent les VIDÉOS ENREGISTRÉES et les SCRIPTS VIDÉO de l'application Naya.
Ne pas confondre avec les événements de planification qui sont une fonctionnalité différente.

📊 STATISTIQUES DES VIDÉOS:
- Total de vidéos enregistrées: ${videoMetrics.total}
- Vidéos avec script: ${videoMetrics.withScript}
- Vidéos sans script: ${videoMetrics.withoutScript}
- Durée totale: ${formatDuration(videoMetrics.totalDuration)}
- Durée moyenne: ${formatDuration(videoMetrics.averageDuration)}

📝 STATISTIQUES DES SCRIPTS:
- Total de scripts créés: ${scriptMetrics.total}
- Scripts utilisés pour vidéos: ${scriptMetrics.used}
- Scripts non utilisés: ${scriptMetrics.unused}

📹 VIDÉOS RÉCENTES:
${
  recentVideos.length > 0
    ? recentVideos
        .map(
          (v) =>
            `- ${v.scriptTitle || "Sans titre"} (${formatDuration(
              v.duration || 0
            )}) - ${new Date(v.createdAt).toLocaleDateString()}`
        )
        .join("\n")
    : "- Aucune vidéo enregistrée"
}

📝 SCRIPTS RÉCENTS:
${
  recentScripts.length > 0
    ? recentScripts
        .map(
          (s) =>
            `- "${s.title}" (${
              s.content ? Math.round(s.content.length / 100) * 100 : 0
            } caractères) - ${new Date(
              s.updatedAt || s.createdAt
            ).toLocaleDateString()}`
        )
        .join("\n")
    : "- Aucun script créé"
}

RAPPEL: Quand l'utilisateur demande des informations sur ses "vidéos" ou "scripts", il fait référence aux contenus vidéo de l'application Naya, pas aux événements de planification.
`;

    return context.trim();
  } catch (error) {
    return `📹 CONTEXTE VIDÉOS:
L'utilisateur utilise l'application Naya pour créer des scripts et enregistrer des vidéos.
Tu peux l'aider avec la création de contenu, l'organisation de ses scripts et la gestion de ses vidéos.`;
  }
};
