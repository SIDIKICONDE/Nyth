// Enum pour les rôles utilisateur
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

// Type pour le design du profil
export type ProfileDesignType = "classic";

// Interface pour les préférences d'affichage du profil
export interface ProfileDisplayPreferences {
  showAnalytics: boolean;
  showAchievements: boolean;
  profileDesign: ProfileDesignType;
}

export interface UserProfile {
  // Informations de base (déjà existantes)
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;

  // Rôle utilisateur
  role?: UserRole;

  // Informations personnelles
  firstName?: string;
  lastName?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;

  // Préférences
  language?: string;
  theme?: string;
  notifications?: NotificationPreferences;
  profilePreferences?: ProfileDisplayPreferences; // Nouveau: préférences d'affichage du profil

  // Statistiques
  stats?: UserStats;

  // Métadonnées
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;

  // Profil professionnel
  profession?: string;
  company?: string;
  website?: string;

  // Réseaux sociaux
  socials?: SocialLinks;

  // Paramètres de confidentialité
  privacy?: PrivacySettings;

  emailVerified?: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  scriptReminders: boolean;
  weeklyReport: boolean;
  newFeatures: boolean;
}

export interface UserStats {
  totalScripts: number;
  totalRecordings: number;
  totalRecordingTime: number; // en secondes
  totalFavorites: number; // Nouveau: nombre de scripts favoris
  favoriteScriptCategory?: string;
  lastScriptCreated?: string;
  lastRecordingDate?: string;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
  instagram?: string;
}

export interface PrivacySettings {
  profileVisibility: "public" | "private" | "friends";
  showEmail: boolean;
  showPhone: boolean;
  showStats: boolean;
  allowAnalytics: boolean;
}

// Types pour les mises à jour
export type UserProfileUpdate = Partial<UserProfile>;

// Valeurs par défaut
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  scriptReminders: true,
  weeklyReport: false,
  newFeatures: true,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: "private",
  showEmail: false,
  showPhone: false,
  showStats: true,
  allowAnalytics: true,
};

export const DEFAULT_USER_STATS: UserStats = {
  totalScripts: 0,
  totalRecordings: 0,
  totalRecordingTime: 0,
  totalFavorites: 0,
};

export const DEFAULT_PROFILE_DISPLAY_PREFERENCES: ProfileDisplayPreferences = {
  showAnalytics: false,
  showAchievements: false,
  profileDesign: "classic",
};
