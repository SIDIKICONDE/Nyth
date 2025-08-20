import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
} from "@react-native-firebase/firestore";
import {
  VideoCodec,
  VideoQuality,
  VideoStabilization,
} from "../../types/video";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("UserPreferencesService");

export interface UserPreferences {
  // ID de l'utilisateur
  userId?: string;

  // Préférences d'affichage
  theme?: string;
  language?: string;
  fontFamily?: string;
  scriptDisplayStyle?: "list" | "library";
  homePage?: "default" | "planning" | "ai-chat";

  // Préférences de l'application
  autoSaveEnabled?: boolean;
  showTutorials?: boolean;
  showAnalytics?: boolean;
  showAchievements?: boolean;
  guestFABEnabled?: boolean;

  // Paramètres d'alertes
  alertSettings?: {
    disableAllAlerts?: boolean;
    disableSaveConfirmations?: boolean;
    disableResetConfirmations?: boolean;
    disableErrorAlerts?: boolean;
  };

  // Paramètres de téléprompteur
  teleprompterSettings?: {
    scrollSpeed?: number;
    fontSize?: number;
    textAlignment?: "left" | "center" | "right";
    textColor?: string;
    backgroundColor?: string;
    mirrorMode?: boolean;
    textShadow?: boolean;
    horizontalMargin?: number;
    scrollAreaTop?: number;
    scrollAreaBottom?: number;
    scrollStartLevel?: number;
    positionOffset?: number;
    // Méthode de défilement et paramètres associés
    scrollCalculationMethod?: "classic" | "wpm" | "duration" | "lines";
    scrollWPM?: number;
    scrollDurationMinutes?: number;
    scrollLinesPerSecond?: number;
  };

  // Paramètres d'enregistrement
  recordingSettings?: {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    quality?: string;
    countdown?: number;
    fontSize?: number;
    textColor?: string;
    horizontalMargin?: number;
    isCompactMode?: boolean;
    scrollSpeed?: number;
    isMirrored?: boolean;
    isMicEnabled?: boolean;
    isVideoEnabled?: boolean;
    textAlignment?: "left" | "center" | "right";
    textShadow?: boolean;
    showCountdown?: boolean;
    countdownDuration?: number;
    videoQuality?: string;
    scrollAreaTop?: number;
    scrollAreaBottom?: number;
    scrollStartLevel?: number;
    videoSettings?: {
      codec?: VideoCodec;
      quality?: VideoQuality;
      stabilization?: VideoStabilization;
    };
  };

  // Préférences AI
  aiGeneratorPreferences?: {
    tone?: string;
    platform?: string;
    language?: string;
    creativity?: number;
    duration?: string;
    narrativeStructure?: string;
    emotionalTone?: string;
  };

  // Préférences de chat
  chatPreferences?: {
    autoScroll?: boolean;
    fontSize?: number;
    fontFamily?: string;
  };

  // Préférences de profil
  profilePreferences?: {
    showStats?: boolean;
    showAchievements?: boolean;
    publicProfile?: boolean;
  };

  // Paramètres de sécurité
  securitySettings?: {
    enhancedMode?: boolean;
    bypassProtection?: boolean;
    
  };

  // Préférences de planification étendues
  planningPreferences?: {
    defaultTab?: "timeline" | "tasks" | "calendar";
    notifications?: boolean;
    weeklyReminders?: boolean;
    goalReminders?: boolean;
    showWeekends?: boolean;
    autoSync?: boolean;
    darkMode?: boolean;
    notificationSettings?: {
      pushNotifications?: boolean;
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      eventReminders?: {
        enabled?: boolean;
        defaultTiming?: number[];
        customTiming?: number[];
        allowMultiple?: boolean;
      };
      goalReminders?: {
        enabled?: boolean;
        dailyProgress?: boolean;
        weeklyReview?: boolean;
        overdueAlerts?: boolean;
        achievementCelebrations?: boolean;
        progressMilestones?: boolean;
      };
      taskReminders?: {
        enabled?: boolean;
        dueDateAlerts?: boolean;
        startDateAlerts?: boolean;
        overdueAlerts?: boolean;
        completionSuggestions?: boolean;
      };
      quietHours?: {
        enabled?: boolean;
        startTime?: string;
        endTime?: string;
        weekendsOnly?: boolean;
      };
      soundSettings?: {
        enabled?: boolean;
        defaultSound?: string;
        customSounds?: {
          events?: string;
          goals?: string;
          tasks?: string;
          achievements?: string;
        };
        vibration?: boolean;
        vibrationPattern?: "default" | "short" | "long" | "custom";
      };
      smartNotifications?: {
        enabled?: boolean;
        aiSuggestions?: boolean;
        habitBasedReminders?: boolean;
        productivityInsights?: boolean;
        adaptiveTiming?: boolean;
      };
      integrations?: {
        calendar?: {
          enabled?: boolean;
          provider?: "google" | "outlook" | "apple" | null;
          syncReminders?: boolean;
        };
        teamNotifications?: boolean;
        webhooks?: {
          enabled?: boolean;
          urls?: string[];
        };
      };
      priorities?: {
        showLowPriority?: boolean;
        showMediumPriority?: boolean;
        showHighPriority?: boolean;
        showUrgentOnly?: boolean;
      };
      customMessages?: {
        enabled?: boolean;
        templates?: {
          eventReminder?: string;
          goalProgress?: string;
          taskDue?: string;
          achievement?: string;
        };
      };
    };
  };

  // Métadonnées
  createdAt?: any;
  updatedAt?: any;
}

class UserPreferencesService {
  private static instance: UserPreferencesService;

  private constructor() {}

  static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  async savePreferences(
    userId: string,
    preferences: UserPreferences
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const prefsRef = doc(collection(db, "userPreferences"), userId);
      const dataToSave = {
        ...preferences,
        userId,
        updatedAt: new Date().toISOString(),
        ...(preferences.createdAt
          ? {}
          : { createdAt: new Date().toISOString() }),
      };

      await setDoc(prefsRef, dataToSave, { merge: true });

      logger.info("✅ Préférences synchronisées avec Firestore");
    } catch (error) {
      logger.error("❌ Erreur lors de la sauvegarde des préférences:", error);
      throw error;
    }
  }

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const db = getFirestore(getApp());
      const prefsRef = doc(collection(db, "userPreferences"), userId);
      const docSnap = await getDoc(prefsRef);

      if (docSnap.exists()) {
        logger.info("✅ Préférences récupérées depuis Firestore");
        return docSnap.data() as UserPreferences;
      }

      return null;
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération des préférences:", error);
      return null;
    }
  }

  async updatePreference<K extends keyof UserPreferences>(
    userId: string,
    key: K,
    value: UserPreferences[K]
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const prefsRef = doc(collection(db, "userPreferences"), userId);
      const updateData = {
        [key]: value,
        userId,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(prefsRef, updateData, { merge: true });

      logger.info(`✅ Préférence ${key} mise à jour`);
    } catch (error) {
      logger.error(`❌ Erreur lors de la mise à jour de ${key}:`, error);
      throw error;
    }
  }

  // Méthode pour migrer les préférences locales vers Firebase
  async migrateLocalPreferences(
    userId: string,
    localPreferences: Record<string, any>
  ): Promise<void> {
    try {
      const preferences: UserPreferences = {
        userId,
        theme: localPreferences.theme,
        language: localPreferences.language,
        fontFamily: localPreferences.fontFamily,
        scriptDisplayStyle: localPreferences.scriptDisplayStyle,
        autoSaveEnabled: localPreferences.autoSaveEnabled,
        guestFABEnabled: localPreferences.guestFABEnabled,

        recordingSettings: localPreferences.recordingSettings,

        teleprompterSettings: localPreferences.teleprompterSettings,

        aiGeneratorPreferences: localPreferences.aiGeneratorPreferences,
        chatPreferences: localPreferences.chatPreferences,
        profilePreferences: localPreferences.profilePreferences,
        securitySettings: localPreferences.securitySettings,
      };

      await this.savePreferences(userId, preferences);
      logger.info("✅ Préférences locales migrées vers Firebase");
    } catch (error) {
      logger.error("❌ Erreur lors de la migration des préférences:", error);
      throw error;
    }
  }

  // Méthode pour sauvegarder tous les paramètres d'un coup
  async saveAllSettings(
    userId: string,
    settings: {
      recordingSettings?: any;
      teleprompterSettings?: any;
      securitySettings?: any;
      displayPreferences?: any;
    }
  ): Promise<void> {
    try {
      const preferences: Partial<UserPreferences> = {
        userId,
      };

      if (settings.recordingSettings) {
        preferences.recordingSettings = settings.recordingSettings;
      }

      if (settings.teleprompterSettings) {
        preferences.teleprompterSettings = settings.teleprompterSettings;
      }

      if (settings.securitySettings) {
        preferences.securitySettings = settings.securitySettings;
      }

      if (settings.displayPreferences) {
        preferences.scriptDisplayStyle =
          settings.displayPreferences.scriptDisplayStyle;
      }

      await this.savePreferences(userId, preferences);
      logger.info("✅ Tous les paramètres synchronisés avec Firebase");
    } catch (error) {
      logger.error("❌ Erreur lors de la sauvegarde des paramètres:", error);
      throw error;
    }
  }
}

export default UserPreferencesService.getInstance();
