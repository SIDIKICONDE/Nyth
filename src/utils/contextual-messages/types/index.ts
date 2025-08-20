export interface UserContext {
  // Informations de base
  userId: string;
  userName: string | null;
  email: string | null;
  profilePictureUrl?: string;

  // Statut de connexion
  isFirstLogin: boolean;
  isReturningUser: boolean;
  daysSinceLastLogin: number;
  loginFrequency: "daily" | "weekly" | "occasional" | "rare";

  // Activité et contenu
  scriptsCount: number;
  recordingsCount: number;
  favoriteScriptsCount: number;
  totalWordsWritten: number;
  averageScriptLength: number;
  mostUsedTopics: string[];
  contentQualityScore: number;

  // Engagement
  consecutiveDays: number;
  totalDaysActive: number;
  engagementScore: number;
  featureUsageMap: Record<string, number>;
  preferredFeatures: string[];

  // Contexte temporel
  timeOfDay:
    | "early_morning"
    | "morning"
    | "afternoon"
    | "evening"
    | "night"
    | "late_night";
  dayOfWeek:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  season: "spring" | "summer" | "autumn" | "winter";
  isHoliday: boolean;
  timezone: string;

  // Préférences et comportement
  preferredLanguage: string;
  preferredMessageTone: "formal" | "casual" | "motivational" | "educational";
  interactionHistory: MessageInteraction[];
  messagePreferences: MessagePreferences;

  // Performance et progression
  productivityTrend: "increasing" | "stable" | "decreasing";
  milestoneProgress: MilestoneProgress[];
  achievements: Achievement[];
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert";

  // Contexte social
  referralSource?: string;
  teamSize?: number;
  collaborationLevel: "solo" | "team" | "enterprise";

  // Données techniques
  deviceType: "mobile" | "tablet" | "desktop";
  platform: "ios" | "android" | "web";
  appVersion: string;
  lastActiveDate: string;

  planning?: {
    upcomingEventsCount: number;
    overdueEventsCount: number;
    activeGoalsCount: number;
    nextEventTitle?: string;
    nextEventDate?: string;
  };
}

export interface MessageScore {
  relevanceScore: number;
  engagementScore: number;
  personalityMatchScore: number;
  timingScore: number;
  contextScore: number;
  noveltyScore: number;
  totalScore: number;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  name: string;
  value: number;
  weight: number;
  reason: string;
}

export interface ContextualMessage {
  id: string;
  title: string;
  message: string;
  emoji: string;
  type: MessageType;
  priority: MessagePriority;
  category: MessageCategory;
  tags: string[];
  metadata: MessageMetadata;
  personalizationTokens: Record<string, any>;
  variations: MessageVariation[];
  conditions: MessageCondition[];
  scoring: MessageScore;
}

export type MessageType =
  | "welcome"
  | "motivation"
  | "tip"
  | "achievement"
  | "reminder"
  | "celebration"
  | "educational"
  | "feature_discovery"
  | "milestone"
  | "feedback_request"
  | "re_engagement"
  | "seasonal";

export type MessagePriority = "critical" | "high" | "medium" | "low";

export type MessageCategory =
  | "onboarding"
  | "engagement"
  | "retention"
  | "education"
  | "motivation"
  | "achievement"
  | "feature_adoption"
  | "community";

export interface MessageMetadata {
  createdAt: string;
  lastShown?: string;
  showCount: number;
  effectiveness: number;
  userFeedback?: UserFeedback;
  abTestGroup?: string;
  expiresAt?: string;
  targetAudience: string[];
  excludeAudience: string[];
}

export interface MessageVariation {
  id: string;
  content: string;
  tone: "formal" | "casual" | "motivational" | "educational";
  length: "short" | "medium" | "long";
  effectiveness: number;
}

export interface MessageCondition {
  type: "user_property" | "behavior" | "time" | "achievement" | "custom";
  property: string;
  operator: "equals" | "greater_than" | "less_than" | "contains" | "between";
  value: any;
  weight: number;
}

export interface MessageInteraction {
  messageId: string;
  timestamp: string;
  action: "viewed" | "clicked" | "dismissed" | "rated";
  engagementDuration?: number;
  feedback?: UserFeedback;
}

export interface UserFeedback {
  rating: number;
  helpful: boolean;
  comment?: string;
  timestamp: string;
}

export interface MessagePreferences {
  preferredTypes: MessageType[];
  preferredTimes: string[];
  frequencyLimit: number;
  blockedCategories: MessageCategory[];
  customPreferences: Record<string, any>;
}

export interface MilestoneProgress {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  estimatedCompletionDate?: string;
  reward?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  category: string;
}

export interface AIGenerationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  systemPrompt: string;
  userContextDepth: "basic" | "detailed" | "comprehensive";
  includeHistory: boolean;
  personalizationLevel: number;
}
