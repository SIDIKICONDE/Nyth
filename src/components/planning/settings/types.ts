export interface PlanningSettings {
  defaultTab: "timeline" | "tasks" | "calendar";
  notifications: boolean;
  weeklyReminders: boolean;
  goalReminders: boolean;
  showWeekends: boolean;
  autoSync: boolean;
  darkMode: boolean;

  // Notifications étendues
  notificationSettings: ExtendedNotificationSettings;
}

export interface ExtendedNotificationSettings {
  // Types de notifications
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;

  // Rappels d'événements
  eventReminders: {
    enabled: boolean;
    defaultTiming: number[]; // minutes avant: [5, 15, 60, 1440]
    customTiming: number[];
    allowMultiple: boolean;
  };

  // Rappels d'objectifs
  goalReminders: {
    enabled: boolean;
    dailyProgress: boolean;
    weeklyReview: boolean;
    overdueAlerts: boolean;
    achievementCelebrations: boolean;
    progressMilestones: boolean;
  };

  // Rappels de tâches
  taskReminders: {
    enabled: boolean;
    dueDateAlerts: boolean;
    startDateAlerts: boolean;
    overdueAlerts: boolean;
    completionSuggestions: boolean;
  };

  // Horaires et timing
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "08:00"
    weekendsOnly: boolean;
  };

  // Sons et vibrations
  soundSettings: {
    enabled: boolean;
    defaultSound: string;
    customSounds: {
      events: string;
      goals: string;
      tasks: string;
      achievements: string;
    };
    vibration: boolean;
    vibrationPattern: "default" | "short" | "long" | "custom";
  };

  // Notifications intelligentes
  smartNotifications: {
    enabled: boolean;
    aiSuggestions: boolean;
    habitBasedReminders: boolean;
    productivityInsights: boolean;
    adaptiveTiming: boolean;
  };

  // Intégrations
  integrations: {
    calendar: {
      enabled: boolean;
      provider: "google" | "outlook" | "apple" | null;
      syncReminders: boolean;
    };
    teamNotifications: boolean;
    webhooks: {
      enabled: boolean;
      urls: string[];
    };
  };

  // Filtres et priorités
  priorities: {
    showLowPriority: boolean;
    showMediumPriority: boolean;
    showHighPriority: boolean;
    showUrgentOnly: boolean;
  };

  // Messages personnalisés
  customMessages: {
    enabled: boolean;
    templates: {
      eventReminder: string;
      goalProgress: string;
      taskDue: string;
      achievement: string;
    };
  };
}

export interface PlanningSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface SettingItemProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon: string;
}
