export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "scripts" | "recordings" | "engagement" | "special" | "social" | "learning" | "quality" | "collaboration";
  requiredValue: number;
  currentValue?: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  xpReward?: number;
  hidden?: boolean; // Achievements cachés jusqu'à déblocage
  prerequisiteId?: string; // Achievement prérequis
}

export interface UserLevel {
  level: number;
  currentXP: number;
  requiredXP: number;
  title: string;
  tier?: "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master";
}

// Nouveau: Actions qui donnent des points
export interface PointAction {
  id: string;
  name: string;
  points: number;
  dailyLimit?: number;
  description?: string;
}

// Nouveau: Défis quotidiens et hebdomadaires
export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "monthly";
  icon: string;
  requiredValue: number;
  currentValue: number;
  xpReward: number;
  pointsReward: number;
  expiresAt: Date;
  isCompleted: boolean;
  category: string;
}

// Nouveau: Système de streaks
export interface Streak {
  type: "daily_login" | "daily_recording" | "daily_script" | "weekly_activity";
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  multiplier: number; // Multiplicateur de points basé sur le streak
}

// Nouveau: Missions
export interface Mission {
  id: string;
  name: string;
  description: string;
  steps: MissionStep[];
  totalXpReward: number;
  totalPointsReward: number;
  unlockedBadgeId?: string;
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
}

export interface MissionStep {
  id: string;
  description: string;
  requiredValue: number;
  currentValue: number;
  isCompleted: boolean;
}

// Nouveau: Statistiques de gamification
export interface GamificationStats {
  totalPoints: number;
  totalXP: number;
  level: UserLevel;
  achievementsUnlocked: number;
  totalAchievements: number;
  streaks: Streak[];
  completedChallenges: number;
  completedMissions: number;
  rank?: number; // Classement global
  percentile?: number; // Top X%
}

// Actions qui donnent des points
export const POINT_ACTIONS: PointAction[] = [
  { id: "create_script", name: "Créer un script", points: 10 },
  { id: "edit_script", name: "Modifier un script", points: 5, dailyLimit: 10 },
  { id: "share_script", name: "Partager un script", points: 15 },
  { id: "record_video", name: "Enregistrer une vidéo", points: 20 },
  { id: "record_long_video", name: "Vidéo > 5 minutes", points: 30 },
  { id: "record_hd_video", name: "Vidéo en HD", points: 25 },
  { id: "daily_login", name: "Connexion quotidienne", points: 5, dailyLimit: 1 },
  { id: "complete_profile", name: "Compléter le profil", points: 50 },
  { id: "invite_friend", name: "Inviter un ami", points: 100 },
  { id: "first_recording", name: "Premier enregistrement", points: 50 },
  { id: "use_teleprompter", name: "Utiliser le téléprompteur", points: 10 },
  { id: "export_video", name: "Exporter une vidéo", points: 15 },
  { id: "rate_app", name: "Noter l'application", points: 100 },
  { id: "complete_tutorial", name: "Terminer le tutoriel", points: 30 },
  { id: "use_ai_feature", name: "Utiliser l'IA", points: 20 },
  { id: "customize_theme", name: "Personnaliser le thème", points: 10 },
];

export const ACHIEVEMENTS: Achievement[] = [
  // === SCRIPTS ===
  {
    id: "first_script",
    name: "Premier Pas",
    description: "Créer votre premier script",
    icon: "file-document-edit",
    category: "scripts",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "script_creator_10",
    name: "Créateur Actif",
    description: "Créer 10 scripts",
    icon: "file-multiple",
    category: "scripts",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "script_master_50",
    name: "Maître Scripteur",
    description: "Créer 50 scripts",
    icon: "file-star",
    category: "scripts",
    requiredValue: 50,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 200,
  },
  {
    id: "script_legend_100",
    name: "Légende du Script",
    description: "Créer 100 scripts",
    icon: "file-star-outline",
    category: "scripts",
    requiredValue: 100,
    isUnlocked: false,
    rarity: "legendary",
    xpReward: 500,
  },
  {
    id: "script_god_500",
    name: "Dieu du Script",
    description: "Créer 500 scripts - Un accomplissement mythique!",
    icon: "crown",
    category: "scripts",
    requiredValue: 500,
    isUnlocked: false,
    rarity: "mythic",
    xpReward: 1000,
    hidden: true,
  },

  // === ENREGISTREMENTS ===
  {
    id: "first_recording",
    name: "Action!",
    description: "Faire votre premier enregistrement",
    icon: "video",
    category: "recordings",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "recording_streak_5",
    name: "En Série",
    description: "Faire 5 enregistrements",
    icon: "video-box",
    category: "recordings",
    requiredValue: 5,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "recording_pro_25",
    name: "Vidéaste Pro",
    description: "Faire 25 enregistrements",
    icon: "video-check",
    category: "recordings",
    requiredValue: 25,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 200,
  },
  {
    id: "recording_expert_100",
    name: "Expert Vidéo",
    description: "Faire 100 enregistrements",
    icon: "video-vintage",
    category: "recordings",
    requiredValue: 100,
    isUnlocked: false,
    rarity: "legendary",
    xpReward: 500,
  },

  // === QUALITÉ ===
  {
    id: "quality_hd_first",
    name: "Haute Définition",
    description: "Enregistrer votre première vidéo en HD",
    icon: "high-definition",
    category: "quality",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "common",
    xpReward: 75,
  },
  {
    id: "quality_4k_master",
    name: "Maître 4K",
    description: "Enregistrer 10 vidéos en 4K",
    icon: "quality-high",
    category: "quality",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 300,
  },
  {
    id: "quality_perfect_take",
    name: "Prise Parfaite",
    description: "Enregistrer une vidéo de plus de 10 minutes sans pause",
    icon: "star-circle",
    category: "quality",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 150,
  },

  // === TEMPS D'ENREGISTREMENT ===
  {
    id: "time_1hour",
    name: "Une Heure",
    description: "Enregistrer 1 heure au total",
    icon: "clock-check",
    category: "recordings",
    requiredValue: 3600,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "time_10hours",
    name: "Marathon",
    description: "Enregistrer 10 heures au total",
    icon: "clock-outline",
    category: "recordings",
    requiredValue: 36000,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 250,
  },
  {
    id: "time_100hours",
    name: "Centurion",
    description: "Enregistrer 100 heures au total",
    icon: "trophy",
    category: "recordings",
    requiredValue: 360000,
    isUnlocked: false,
    rarity: "legendary",
    xpReward: 750,
  },
  {
    id: "time_1000hours",
    name: "Millénaire",
    description: "Enregistrer 1000 heures - Dévouement absolu!",
    icon: "infinity",
    category: "recordings",
    requiredValue: 3600000,
    isUnlocked: false,
    rarity: "mythic",
    xpReward: 2000,
    hidden: true,
  },

  // === ENGAGEMENT ===
  {
    id: "profile_complete",
    name: "Profil Complet",
    description: "Compléter toutes les sections du profil",
    icon: "account-check",
    category: "engagement",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "daily_user_7",
    name: "Habitué",
    description: "Utiliser l'app 7 jours consécutifs",
    icon: "calendar-check",
    category: "engagement",
    requiredValue: 7,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "daily_user_30",
    name: "Fidèle",
    description: "Utiliser l'app 30 jours consécutifs",
    icon: "calendar-star",
    category: "engagement",
    requiredValue: 30,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 300,
  },
  {
    id: "daily_user_100",
    name: "Dévoué",
    description: "Utiliser l'app 100 jours consécutifs",
    icon: "calendar-heart",
    category: "engagement",
    requiredValue: 100,
    isUnlocked: false,
    rarity: "legendary",
    xpReward: 1000,
  },
  {
    id: "daily_user_365",
    name: "Année Complète",
    description: "Utiliser l'app 365 jours consécutifs - Incroyable!",
    icon: "calendar-multiple-check",
    category: "engagement",
    requiredValue: 365,
    isUnlocked: false,
    rarity: "mythic",
    xpReward: 5000,
    hidden: true,
  },

  // === SOCIAL ===
  {
    id: "social_first_share",
    name: "Partageur",
    description: "Partager votre première vidéo",
    icon: "share-variant",
    category: "social",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "social_influencer",
    name: "Influenceur",
    description: "Partager 20 vidéos",
    icon: "account-group",
    category: "social",
    requiredValue: 20,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 150,
  },
  {
    id: "social_viral",
    name: "Viral",
    description: "Partager 50 vidéos",
    icon: "trending-up",
    category: "social",
    requiredValue: 50,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 400,
  },
  {
    id: "social_ambassador",
    name: "Ambassadeur",
    description: "Inviter 10 amis à utiliser l'app",
    icon: "account-multiple-plus",
    category: "social",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "legendary",
    xpReward: 1000,
  },

  // === APPRENTISSAGE ===
  {
    id: "learning_tutorial",
    name: "Étudiant",
    description: "Terminer le tutoriel",
    icon: "school",
    category: "learning",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "learning_ai_user",
    name: "Utilisateur IA",
    description: "Utiliser l'IA 10 fois",
    icon: "robot",
    category: "learning",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "learning_ai_master",
    name: "Maître de l'IA",
    description: "Utiliser l'IA 100 fois",
    icon: "robot-happy",
    category: "learning",
    requiredValue: 100,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 300,
  },
  {
    id: "learning_teleprompter_pro",
    name: "Pro du Téléprompteur",
    description: "Utiliser le téléprompteur dans 50 enregistrements",
    icon: "text-box-check",
    category: "learning",
    requiredValue: 50,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 250,
  },

  // === COLLABORATION ===
  {
    id: "collab_team_player",
    name: "Esprit d'Équipe",
    description: "Rejoindre votre première équipe",
    icon: "account-group-outline",
    category: "collaboration",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "common",
    xpReward: 75,
  },
  {
    id: "collab_project_creator",
    name: "Chef de Projet",
    description: "Créer 5 projets collaboratifs",
    icon: "folder-account",
    category: "collaboration",
    requiredValue: 5,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 150,
  },
  {
    id: "collab_mentor",
    name: "Mentor",
    description: "Aider 10 utilisateurs avec leurs scripts",
    icon: "human-greeting",
    category: "collaboration",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 400,
  },

  // === SPÉCIAUX / SAISONNIERS ===
  {
    id: "winter_2024",
    name: "Esprit d'Hiver 2024",
    description: "Créer 5 scripts pendant l'hiver 2024",
    icon: "snowflake",
    category: "special",
    requiredValue: 5,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 300,
  },
  {
    id: "new_year_2025",
    name: "Nouvelle Année 2025",
    description: "Faire un enregistrement le jour de l'an 2025",
    icon: "firework",
    category: "special",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 200,
  },
  {
    id: "valentine_2025",
    name: "Saint-Valentin 2025",
    description: "Créer un script d'amour en février",
    icon: "heart",
    category: "special",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 150,
  },
  {
    id: "summer_creator_2025",
    name: "Créateur d'Été",
    description: "Enregistrer 20 vidéos pendant l'été",
    icon: "weather-sunny",
    category: "special",
    requiredValue: 20,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 350,
  },
  {
    id: "halloween_2025",
    name: "Esprit d'Halloween",
    description: "Créer un script effrayant en octobre",
    icon: "halloween",
    category: "special",
    requiredValue: 1,
    isUnlocked: false,
    rarity: "rare",
    xpReward: 150,
  },
  {
    id: "christmas_spirit",
    name: "Esprit de Noël",
    description: "Créer 10 scripts pendant décembre",
    icon: "pine-tree",
    category: "special",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 400,
  },

  // === ACHIEVEMENTS CACHÉS ===
  {
    id: "secret_night_owl",
    name: "Noctambule",
    description: "Enregistrer 10 vidéos entre minuit et 5h du matin",
    icon: "owl",
    category: "special",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 300,
    hidden: true,
  },
  {
    id: "secret_early_bird",
    name: "Lève-tôt",
    description: "Enregistrer 10 vidéos entre 5h et 7h du matin",
    icon: "weather-sunset-up",
    category: "special",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "epic",
    xpReward: 300,
    hidden: true,
  },
  {
    id: "secret_perfectionist",
    name: "Perfectionniste",
    description: "Refaire le même enregistrement 10 fois",
    icon: "refresh",
    category: "special",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "legendary",
    xpReward: 500,
    hidden: true,
  },
  {
    id: "secret_speedrun",
    name: "Speedrun",
    description: "Créer 10 scripts en moins d'une heure",
    icon: "lightning-bolt",
    category: "special",
    requiredValue: 10,
    isUnlocked: false,
    rarity: "legendary",
    xpReward: 750,
    hidden: true,
  },
  {
    id: "secret_collector",
    name: "Collectionneur",
    description: "Débloquer 50 achievements",
    icon: "treasure-chest",
    category: "special",
    requiredValue: 50,
    isUnlocked: false,
    rarity: "mythic",
    xpReward: 2000,
    hidden: true,
  },
];

export const LEVEL_TITLES = [
  { min: 1, max: 5, titleKey: "achievements.levels.beginner", tier: "bronze" as const },
  { min: 6, max: 10, titleKey: "achievements.levels.apprentice", tier: "bronze" as const },
  { min: 11, max: 20, titleKey: "achievements.levels.confirmed", tier: "silver" as const },
  { min: 21, max: 30, titleKey: "achievements.levels.expert", tier: "silver" as const },
  { min: 31, max: 40, titleKey: "achievements.levels.master", tier: "gold" as const },
  { min: 41, max: 50, titleKey: "achievements.levels.grandmaster", tier: "gold" as const },
  { min: 51, max: 75, titleKey: "achievements.levels.legend", tier: "platinum" as const },
  { min: 76, max: 100, titleKey: "achievements.levels.mythic", tier: "diamond" as const },
  { min: 101, max: Infinity, titleKey: "achievements.levels.eternal", tier: "master" as const },
];

// Système de progression XP amélioré avec paliers
export const XP_LEVELS = {
  bronze: { multiplier: 1.0, bonusXP: 0 },
  silver: { multiplier: 1.2, bonusXP: 100 },
  gold: { multiplier: 1.5, bonusXP: 250 },
  platinum: { multiplier: 2.0, bonusXP: 500 },
  diamond: { multiplier: 2.5, bonusXP: 1000 },
  master: { multiplier: 3.0, bonusXP: 2000 },
};

export const calculateLevel = (
  totalXP: number,
  t?: (key: string, fallback: string) => string
): UserLevel => {
  // Progression exponentielle plus douce
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const currentXP = totalXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  const titleInfo = LEVEL_TITLES.find(
    (item) => level >= item.min && level <= item.max
  );
  const titleKey = titleInfo
    ? titleInfo.titleKey
    : "achievements.levels.beginner";
  const title = t ? t(titleKey, "Débutant") : "Débutant";
  const tier = titleInfo?.tier || "bronze";

  return {
    level,
    currentXP,
    requiredXP,
    title,
    tier,
  };
};

// Défis quotidiens prédéfinis
export const DAILY_CHALLENGES: Omit<Challenge, "currentValue" | "expiresAt" | "isCompleted">[] = [
  {
    id: "daily_script",
    name: "Créateur du Jour",
    description: "Créer 3 scripts aujourd'hui",
    type: "daily",
    icon: "file-plus",
    requiredValue: 3,
    xpReward: 50,
    pointsReward: 100,
    category: "scripts",
  },
  {
    id: "daily_recording",
    name: "Vidéaste Actif",
    description: "Enregistrer 2 vidéos aujourd'hui",
    type: "daily",
    icon: "video-plus",
    requiredValue: 2,
    xpReward: 75,
    pointsReward: 150,
    category: "recordings",
  },
  {
    id: "daily_quality",
    name: "Qualité Premium",
    description: "Enregistrer une vidéo en HD ou 4K",
    type: "daily",
    icon: "quality-high",
    requiredValue: 1,
    xpReward: 100,
    pointsReward: 200,
    category: "quality",
  },
  {
    id: "daily_share",
    name: "Partageur Social",
    description: "Partager une vidéo sur les réseaux",
    type: "daily",
    icon: "share",
    requiredValue: 1,
    xpReward: 50,
    pointsReward: 100,
    category: "social",
  },
  {
    id: "daily_ai",
    name: "Assistant IA",
    description: "Utiliser l'IA pour améliorer un script",
    type: "daily",
    icon: "robot",
    requiredValue: 1,
    xpReward: 60,
    pointsReward: 120,
    category: "learning",
  },
];

// Défis hebdomadaires prédéfinis
export const WEEKLY_CHALLENGES: Omit<Challenge, "currentValue" | "expiresAt" | "isCompleted">[] = [
  {
    id: "weekly_marathon",
    name: "Marathon Créatif",
    description: "Créer 15 scripts cette semaine",
    type: "weekly",
    icon: "run-fast",
    requiredValue: 15,
    xpReward: 300,
    pointsReward: 600,
    category: "scripts",
  },
  {
    id: "weekly_video_master",
    name: "Maître Vidéo",
    description: "Enregistrer 10 vidéos cette semaine",
    type: "weekly",
    icon: "video-box",
    requiredValue: 10,
    xpReward: 400,
    pointsReward: 800,
    category: "recordings",
  },
  {
    id: "weekly_time",
    name: "Temps Record",
    description: "Enregistrer 2 heures de vidéo cette semaine",
    type: "weekly",
    icon: "timer",
    requiredValue: 7200,
    xpReward: 500,
    pointsReward: 1000,
    category: "recordings",
  },
  {
    id: "weekly_social",
    name: "Influenceur de la Semaine",
    description: "Partager 5 vidéos cette semaine",
    type: "weekly",
    icon: "account-star",
    requiredValue: 5,
    xpReward: 250,
    pointsReward: 500,
    category: "social",
  },
  {
    id: "weekly_diversity",
    name: "Créateur Polyvalent",
    description: "Créer du contenu dans 3 catégories différentes",
    type: "weekly",
    icon: "shape-plus",
    requiredValue: 3,
    xpReward: 350,
    pointsReward: 700,
    category: "engagement",
  },
];

// Missions prédéfinies
export const MISSIONS: Omit<Mission, "isActive" | "isCompleted" | "completedAt">[] = [
  {
    id: "mission_first_week",
    name: "Première Semaine",
    description: "Complétez votre première semaine en tant que créateur",
    steps: [
      { id: "step1", description: "Créer votre premier script", requiredValue: 1, currentValue: 0, isCompleted: false },
      { id: "step2", description: "Faire votre premier enregistrement", requiredValue: 1, currentValue: 0, isCompleted: false },
      { id: "step3", description: "Personnaliser votre profil", requiredValue: 1, currentValue: 0, isCompleted: false },
      { id: "step4", description: "Utiliser le téléprompteur", requiredValue: 1, currentValue: 0, isCompleted: false },
      { id: "step5", description: "Partager une vidéo", requiredValue: 1, currentValue: 0, isCompleted: false },
    ],
    totalXpReward: 500,
    totalPointsReward: 1000,
    unlockedBadgeId: "badge_first_week_hero",
    category: "onboarding",
    difficulty: "easy",
  },
  {
    id: "mission_content_creator",
    name: "Créateur de Contenu",
    description: "Devenez un créateur de contenu prolifique",
    steps: [
      { id: "step1", description: "Créer 10 scripts", requiredValue: 10, currentValue: 0, isCompleted: false },
      { id: "step2", description: "Enregistrer 5 vidéos", requiredValue: 5, currentValue: 0, isCompleted: false },
      { id: "step3", description: "Atteindre 1 heure d'enregistrement", requiredValue: 3600, currentValue: 0, isCompleted: false },
      { id: "step4", description: "Partager 3 vidéos", requiredValue: 3, currentValue: 0, isCompleted: false },
    ],
    totalXpReward: 1000,
    totalPointsReward: 2000,
    unlockedBadgeId: "badge_content_creator",
    category: "creation",
    difficulty: "medium",
  },
  {
    id: "mission_quality_master",
    name: "Maître de la Qualité",
    description: "Produisez du contenu de haute qualité",
    steps: [
      { id: "step1", description: "Enregistrer 5 vidéos en HD", requiredValue: 5, currentValue: 0, isCompleted: false },
      { id: "step2", description: "Enregistrer une vidéo en 4K", requiredValue: 1, currentValue: 0, isCompleted: false },
      { id: "step3", description: "Faire une prise parfaite (10+ minutes)", requiredValue: 1, currentValue: 0, isCompleted: false },
      { id: "step4", description: "Utiliser l'IA 10 fois", requiredValue: 10, currentValue: 0, isCompleted: false },
    ],
    totalXpReward: 1500,
    totalPointsReward: 3000,
    unlockedBadgeId: "badge_quality_master",
    category: "quality",
    difficulty: "hard",
  },
  {
    id: "mission_social_star",
    name: "Star Sociale",
    description: "Développez votre présence sociale",
    steps: [
      { id: "step1", description: "Partager 10 vidéos", requiredValue: 10, currentValue: 0, isCompleted: false },
      { id: "step2", description: "Inviter 3 amis", requiredValue: 3, currentValue: 0, isCompleted: false },
      { id: "step3", description: "Créer un projet collaboratif", requiredValue: 1, currentValue: 0, isCompleted: false },
      { id: "step4", description: "Obtenir 5 badges sociaux", requiredValue: 5, currentValue: 0, isCompleted: false },
    ],
    totalXpReward: 2000,
    totalPointsReward: 4000,
    unlockedBadgeId: "badge_social_star",
    category: "social",
    difficulty: "expert",
  },
];

// Fonction helper pour obtenir les achievements traduits
export const getTranslatedAchievements = (
  t: (key: string, fallback: string) => string
): Achievement[] => {
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    name: t(`achievements.challenges.${achievement.id}.name`, achievement.name),
    description: t(
      `achievements.challenges.${achievement.id}.description`,
      achievement.description
    ),
  }));
};
