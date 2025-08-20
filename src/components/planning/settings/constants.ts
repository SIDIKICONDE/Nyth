import { PlanningSettings, ExtendedNotificationSettings } from "./types";

export const DEFAULT_EXTENDED_NOTIFICATION_SETTINGS: ExtendedNotificationSettings =
  {
    // Types de notifications (Email et SMS temporairement désactivés)
    pushNotifications: true,
    emailNotifications: false, // Non implémenté - désactivé
    smsNotifications: false, // Non implémenté - désactivé

    // Rappels d'événements
    eventReminders: {
      enabled: true,
      defaultTiming: [15, 60], // 15 min et 1h avant
      customTiming: [],
      allowMultiple: true,
    },

    // Rappels d'objectifs
    goalReminders: {
      enabled: true,
      dailyProgress: true,
      weeklyReview: true,
      overdueAlerts: true,
      achievementCelebrations: true,
      progressMilestones: true,
    },

    // Rappels de tâches
    taskReminders: {
      enabled: true,
      dueDateAlerts: true,
      startDateAlerts: false,
      overdueAlerts: true,
      completionSuggestions: true,
    },

    // Horaires et timing
    quietHours: {
      enabled: false,
      startTime: "22:00",
      endTime: "08:00",
      weekendsOnly: false,
    },

    // Sons et vibrations
    soundSettings: {
      enabled: true,
      defaultSound: "default",
      customSounds: {
        events: "notification",
        goals: "achievement",
        tasks: "reminder",
        achievements: "celebration",
      },
      vibration: true,
      vibrationPattern: "default",
    },

    // Notifications intelligentes
    smartNotifications: {
      enabled: true,
      aiSuggestions: true,
      habitBasedReminders: true,
      productivityInsights: false,
      adaptiveTiming: false,
    },

    // Intégrations
    integrations: {
      calendar: {
        enabled: true,
        provider: null,
        syncReminders: true,
      },
      teamNotifications: true,
      webhooks: {
        enabled: false,
        urls: [],
      },
    },

    // Filtres et priorités
    priorities: {
      showLowPriority: true,
      showMediumPriority: true,
      showHighPriority: true,
      showUrgentOnly: false,
    },

    // Messages personnalisés
    customMessages: {
      enabled: false,
      templates: {
        eventReminder: "Rappel : {{title}} dans {{time}}",
        goalProgress: "Objectif {{title}} : {{progress}}% terminé",
        taskDue: "Tâche {{title}} à terminer avant {{dueDate}}",
        achievement: "🎉 Félicitations ! Vous avez atteint : {{title}}",
      },
    },
  };

export const DEFAULT_PLANNING_SETTINGS: PlanningSettings = {
  defaultTab: "timeline",
  notifications: true,
  weeklyReminders: true,
  goalReminders: true,
  showWeekends: true,
  autoSync: true,
  darkMode: false,
  notificationSettings: DEFAULT_EXTENDED_NOTIFICATION_SETTINGS,
};

export const SETTING_ICONS = {
  notifications: "notifications",
  weeklyReminders: "calendar",
  goalReminders: "flag",
  showWeekends: "calendar-outline",
  autoSync: "cloud",
} as const;
