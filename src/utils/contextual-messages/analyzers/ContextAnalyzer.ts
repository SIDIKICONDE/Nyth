import {
  Achievement,
  MessageInteraction,
  MilestoneProgress,
  UserContext,
} from "@/utils/contextual-messages/types";
import { createLogger } from "@/utils/optimizedLogger";
import type { PlanningEvent, Goal } from "@/types/planning";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import { getDeviceLanguage, getSystemLanguage } from "../../languageDetector";

const logger = createLogger("ContextAnalyzer");

export class ContextAnalyzer {
  private static instance: ContextAnalyzer;

  static getInstance(): ContextAnalyzer {
    if (!this.instance) {
      this.instance = new ContextAnalyzer();
    }
    return this.instance;
  }

  /**
   * Construit un contexte utilisateur complet et sophistiqué
   */
  async buildUserContext(
    user: any,
    scripts: any[],
    recordings: any[],
    analytics?: any
  ): Promise<UserContext> {
    try {
      // Données de base
      const basicInfo = this.extractBasicInfo(user);

      // Analyse temporelle
      const temporalContext = await this.analyzeTemporalContext(user?.id);

      // Analyse d'activité
      const activityAnalysis = this.analyzeActivity(scripts, recordings);

      // Analyse d'engagement
      const engagementAnalysis = await this.analyzeEngagement(
        user?.id,
        scripts,
        recordings,
        analytics
      );

      // Analyse de contenu
      const contentAnalysis = this.analyzeContent(scripts);

      // Analyse de performance
      const performanceAnalysis = this.analyzePerformance(
        scripts,
        recordings,
        temporalContext
      );

      // Préférences et comportement
      const preferences = await this.analyzePreferences(user?.id, analytics);

      // Contexte technique
      const technicalContext = await this.getTechnicalContext();

      // Milestones et achievements
      const progressData = await this.calculateProgress(
        user?.id,
        scripts,
        recordings
      );

      const planningContext = await this.enrichWithPlanning(user?.id);
      const defaultContext = this.getDefaultContext();

      return {
        ...defaultContext,
        ...basicInfo,
        ...temporalContext,
        ...activityAnalysis,
        ...engagementAnalysis,
        ...contentAnalysis,
        ...performanceAnalysis,
        ...preferences,
        ...technicalContext,
        ...progressData,
        ...planningContext,
        userId: basicInfo.userId || "guest", // S'assurer que userId n'est jamais undefined
        lastActiveDate: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Erreur lors de la construction du contexte:", error);
      return this.getDefaultContext();
    }
  }

  private async enrichWithPlanning(
    userId?: string
  ): Promise<Partial<UserContext>> {
    try {
      if (!userId) return {};
      const { getPlanningContextForAI } = await import(
        "@/services/firebase/planning"
      );
      const { default: eventsService } = await import(
        "@/services/firebase/planning/eventsService"
      );
      const { goalsService } = await import(
        "@/services/firebase/planning/goalsService"
      );
      const [events, goals] = (await Promise.all([
        eventsService.getUserEvents(userId),
        goalsService.getUserGoals(userId),
      ])) as [PlanningEvent[], Goal[]];

      const now = new Date();
      const upcoming: PlanningEvent[] = events
        .filter((e) => new Date(e.startDate) >= now)
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

      const overdue: PlanningEvent[] = events.filter(
        (e) =>
          e.status !== "completed" &&
          e.status !== "cancelled" &&
          new Date(e.endDate) < now
      );

      const nextEvent = upcoming[0];

      return {
        planning: {
          upcomingEventsCount: upcoming.length,
          overdueEventsCount: overdue.length,
          activeGoalsCount: (goals || []).filter((g) => g.status === "active")
            .length,
          nextEventTitle: nextEvent?.title,
          nextEventDate: nextEvent?.startDate
            ? new Date(nextEvent.startDate).toISOString()
            : undefined,
        },
      };
    } catch (e) {
      logger.warn("Contexte planning non disponible:", (e as Error)?.message);
      return {};
    }
  }

  private extractBasicInfo(user: any): Partial<UserContext> {
    return {
      userId: user?.id || user?.uid || "guest",
      userName:
        user?.name || user?.displayName || user?.email?.split("@")[0] || null,
      email: user?.email || null,
      profilePictureUrl: user?.photoURL || user?.profilePicture || undefined,
    };
  }

  private async analyzeTemporalContext(
    userId?: string
  ): Promise<Partial<UserContext>> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const month = now.getMonth();

    // Déterminer l'heure de la journée avec plus de précision
    let timeOfDay: UserContext["timeOfDay"];
    if (hour >= 5 && hour < 7) timeOfDay = "early_morning";
    else if (hour >= 7 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 20) timeOfDay = "evening";
    else if (hour >= 20 && hour < 23) timeOfDay = "night";
    else timeOfDay = "late_night";

    // Déterminer la saison
    let season: UserContext["season"];
    if (month >= 2 && month <= 4) season = "spring";
    else if (month >= 5 && month <= 7) season = "summer";
    else if (month >= 8 && month <= 10) season = "autumn";
    else season = "winter";

    // Vérifier si c'est un jour férié (simplification)
    const isHoliday = await this.checkIfHoliday(now);

    // Calculer les jours depuis la dernière connexion
    const daysSinceLastLogin = userId
      ? await this.calculateDaysSinceLastLogin(userId)
      : 0;

    // Déterminer la fréquence de connexion
    const loginFrequency = await this.calculateLoginFrequency(userId);

    return {
      timeOfDay,
      dayOfWeek: dayOfWeek as any,
      season,
      isHoliday,
      timezone: "UTC", // TODO: Implémenter avec react-native-localize
      daysSinceLastLogin,
      loginFrequency,
      isReturningUser: daysSinceLastLogin > 7,
    };
  }

  private analyzeActivity(
    scripts: any[],
    recordings: any[]
  ): Partial<UserContext> {
    const scriptsCount = scripts?.length || 0;
    const recordingsCount = recordings?.length || 0;

    // Calcul des mots totaux avec plus de précision
    const wordAnalysis = this.analyzeWords(scripts);

    // Scripts favoris
    const favoriteScriptsCount =
      scripts?.filter((s) => s.isFavorite).length || 0;

    // Analyse des sujets les plus utilisés
    const mostUsedTopics = this.extractMostUsedTopics(scripts);

    // Score de qualité du contenu
    const contentQualityScore = this.calculateContentQualityScore(scripts);

    return {
      scriptsCount,
      recordingsCount,
      favoriteScriptsCount,
      totalWordsWritten: wordAnalysis.total,
      averageScriptLength: wordAnalysis.average,
      mostUsedTopics,
      contentQualityScore,
      isFirstLogin: scriptsCount === 0 && recordingsCount === 0,
    };
  }

  private async analyzeEngagement(
    userId?: string,
    scripts?: any[],
    recordings?: any[],
    analytics?: any
  ): Promise<Partial<UserContext>> {
    // Jours consécutifs et total
    const consecutiveDays = userId
      ? await this.calculateConsecutiveDays(userId)
      : 0;
    const totalDaysActive = userId
      ? await this.calculateTotalDaysActive(userId)
      : 0;

    // Score d'engagement global
    const engagementScore = this.calculateEngagementScore(
      scripts || [],
      recordings || [],
      consecutiveDays,
      analytics
    );

    // Carte d'utilisation des fonctionnalités
    const featureUsageMap = await this.getFeatureUsageMap(userId);

    // Fonctionnalités préférées
    const preferredFeatures = this.extractPreferredFeatures(featureUsageMap);

    // Historique d'interaction avec les messages
    const interactionHistory = userId
      ? await this.getMessageInteractionHistory(userId)
      : [];

    return {
      consecutiveDays,
      totalDaysActive,
      engagementScore,
      featureUsageMap,
      preferredFeatures,
      interactionHistory,
    };
  }

  private analyzeContent(scripts: any[]): Partial<UserContext> {
    if (!scripts || scripts.length === 0) {
      return {
        mostUsedTopics: [],
        contentQualityScore: 0,
      };
    }

    // Analyse approfondie du contenu
    const topics = this.extractTopicsWithNLP(scripts);
    const quality = this.assessContentQuality(scripts);

    return {
      mostUsedTopics: topics.slice(0, 5),
      contentQualityScore: quality,
    };
  }

  private analyzePerformance(
    scripts: any[],
    recordings: any[],
    temporalContext: any
  ): Partial<UserContext> {
    // Tendance de productivité
    const productivityTrend = this.calculateProductivityTrend(
      scripts,
      recordings
    );

    // Niveau de compétence
    const skillLevel = this.assessSkillLevel(scripts, recordings);

    return {
      productivityTrend,
      skillLevel,
    };
  }

  private async analyzePreferences(
    userId?: string,
    analytics?: any
  ): Promise<Partial<UserContext>> {
    const preferredLanguage = await getSystemLanguage();

    // Analyser le ton préféré basé sur l'historique
    const preferredMessageTone = await this.inferPreferredTone(
      userId,
      analytics
    );

    // Préférences de messages
    const messagePreferences = userId
      ? await this.getMessagePreferences(userId)
      : this.getDefaultMessagePreferences();

    return {
      preferredLanguage,
      preferredMessageTone,
      messagePreferences,
    };
  }

  private async getTechnicalContext(): Promise<Partial<UserContext>> {
    const isTablet = await DeviceInfo.isTablet();
    const deviceType = isTablet ? "tablet" : "mobile";

    const systemName = await DeviceInfo.getSystemName();
    const platform = systemName.toLowerCase() === "ios" ? "ios" : "android";

    const appVersion = DeviceInfo.getVersion();

    return {
      deviceType,
      platform,
      appVersion,
    };
  }

  private async calculateProgress(
    userId?: string,
    scripts?: any[],
    recordings?: any[]
  ): Promise<Partial<UserContext>> {
    const milestones = await this.calculateMilestones(
      userId,
      scripts,
      recordings
    );
    const achievements = await this.getAchievements(userId);

    return {
      milestoneProgress: milestones,
      achievements,
      collaborationLevel: "solo", // À déterminer selon le contexte
    };
  }

  // Méthodes utilitaires privées

  private analyzeWords(scripts: any[]): { total: number; average: number } {
    if (!scripts || scripts.length === 0) return { total: 0, average: 0 };

    const wordCounts = scripts.map((script) => {
      const content = script.content || "";
      return content.split(/\s+/).filter((word: string) => word.length > 0)
        .length;
    });

    const total = wordCounts.reduce((sum, count) => sum + count, 0);
    const average = Math.round(total / scripts.length);

    return { total, average };
  }

  private extractMostUsedTopics(scripts: any[]): string[] {
    const topicMap = new Map<string, number>();

    scripts.forEach((script) => {
      // Extraire les mots-clés du contenu
      const keywords = this.extractKeywords(script.content || "");
      keywords.forEach((keyword) => {
        topicMap.set(keyword, (topicMap.get(keyword) || 0) + 1);
      });
    });

    // Trier par fréquence et retourner les top 5
    return Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private extractKeywords(content: string): string[] {
    // Implémentation simplifiée - dans un cas réel, utiliser NLP
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      "le",
      "la",
      "de",
      "du",
      "des",
      "un",
      "une",
      "et",
      "à",
      "pour",
      "dans",
      "sur",
      "avec",
      "par",
      "comme",
      "que",
      "qui",
      "quoi",
    ]);

    return words
      .filter((word) => word.length > 4 && !stopWords.has(word))
      .slice(0, 10);
  }

  private calculateContentQualityScore(scripts: any[]): number {
    if (!scripts || scripts.length === 0) return 0;

    let totalScore = 0;

    scripts.forEach((script) => {
      let score = 50; // Score de base

      // Longueur du contenu
      const wordCount = (script.content || "").split(/\s+/).length;
      if (wordCount > 100) score += 10;
      if (wordCount > 300) score += 10;

      // Présence de structure (paragraphes)
      if ((script.content || "").includes("\n\n")) score += 10;

      // Utilisation de ponctuation variée
      const punctuation = ["!", "?", ":", ";", "-"];
      punctuation.forEach((p) => {
        if ((script.content || "").includes(p)) score += 2;
      });

      // Script favori = qualité perçue
      if (script.isFavorite) score += 10;

      totalScore += Math.min(100, score);
    });

    return Math.round(totalScore / scripts.length);
  }

  private calculateEngagementScore(
    scripts: any[],
    recordings: any[],
    consecutiveDays: number,
    analytics?: any
  ): number {
    let score = 0;

    // Activité récente
    if (scripts.length > 0) score += 20;
    if (recordings.length > 0) score += 20;

    // Régularité
    if (consecutiveDays > 3) score += 10;
    if (consecutiveDays > 7) score += 10;
    if (consecutiveDays > 30) score += 20;

    // Diversité d'utilisation
    const uniqueFeatures = analytics?.uniqueFeatures || 0;
    score += Math.min(20, uniqueFeatures * 5);

    return Math.min(100, score);
  }

  private async calculateConsecutiveDays(userId: string): Promise<number> {
    try {
      const key = `@consecutive_days_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async calculateTotalDaysActive(userId: string): Promise<number> {
    try {
      const key = `@total_days_active_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 1;
    } catch {
      return 1;
    }
  }

  private async calculateDaysSinceLastLogin(userId: string): Promise<number> {
    try {
      const key = `@last_login_${userId}`;
      const lastLogin = await AsyncStorage.getItem(key);

      if (!lastLogin) return 0;

      const daysDiff = Math.floor(
        (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysDiff;
    } catch {
      return 0;
    }
  }

  private async calculateLoginFrequency(
    userId?: string
  ): Promise<UserContext["loginFrequency"]> {
    if (!userId) return "rare";

    try {
      const key = `@login_history_${userId}`;
      const history = await AsyncStorage.getItem(key);

      if (!history) return "rare";

      const logins = JSON.parse(history) as string[];
      const last30Days = logins.filter((date) => {
        const daysDiff =
          (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
      });

      if (last30Days.length >= 25) return "daily";
      if (last30Days.length >= 10) return "weekly";
      if (last30Days.length >= 3) return "occasional";
      return "rare";
    } catch {
      return "occasional";
    }
  }

  private async checkIfHoliday(date: Date): Promise<boolean> {
    // Implémentation simplifiée - pourrait utiliser une API de jours fériés
    const month = date.getMonth();
    const day = date.getDate();

    // Quelques jours fériés français
    const holidays = [
      { month: 0, day: 1 }, // Nouvel An
      { month: 4, day: 1 }, // Fête du Travail
      { month: 6, day: 14 }, // Fête Nationale
      { month: 11, day: 25 }, // Noël
    ];

    return holidays.some((h) => h.month === month && h.day === day);
  }

  private async getFeatureUsageMap(
    userId?: string
  ): Promise<Record<string, number>> {
    if (!userId) return {};

    try {
      const key = `@feature_usage_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private extractPreferredFeatures(usageMap: Record<string, number>): string[] {
    return Object.entries(usageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([feature]) => feature);
  }

  private async getMessageInteractionHistory(
    userId: string
  ): Promise<MessageInteraction[]> {
    try {
      const key = `@message_interactions_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private extractTopicsWithNLP(scripts: any[]): string[] {
    // Version avancée avec analyse sémantique
    const topicFrequency = new Map<string, number>();

    scripts.forEach((script) => {
      const content = script.content || "";

      // Extraction de phrases clés
      const sentences = content.split(/[.!?]/);
      sentences.forEach((sentence: string) => {
        const keywords = this.extractKeyPhrases(sentence);
        keywords.forEach((keyword) => {
          topicFrequency.set(keyword, (topicFrequency.get(keyword) || 0) + 1);
        });
      });
    });

    return Array.from(topicFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
  }

  private extractKeyPhrases(text: string): string[] {
    // Implémentation simplifiée d'extraction de phrases clés
    const words = text.toLowerCase().split(/\s+/);
    const phrases: string[] = [];

    // Bi-grammes
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].length > 3 && words[i + 1].length > 3) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
      }
    }

    return phrases;
  }

  private assessContentQuality(scripts: any[]): number {
    if (!scripts || scripts.length === 0) return 0;

    const qualityFactors = scripts.map((script) => {
      const content = script.content || "";
      let score = 0;

      // Facteurs de qualité
      const wordCount = content.split(/\s+/).length;
      const sentenceCount = content.split(/[.!?]/).length;
      const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);

      // Score basé sur la longueur
      if (wordCount > 50 && wordCount < 2000) score += 20;

      // Score basé sur la structure des phrases
      if (avgWordsPerSentence > 8 && avgWordsPerSentence < 25) score += 20;

      // Vocabulaire varié
      const uniqueWords = new Set(content.toLowerCase().split(/\s+/));
      const vocabularyRichness = uniqueWords.size / wordCount;
      if (vocabularyRichness > 0.4) score += 20;

      // Structure (paragraphes)
      if (content.includes("\n\n")) score += 20;

      // Ponctuation
      const punctuationMarks = (content.match(/[.,;:!?-]/g) || []).length;
      if (punctuationMarks / sentenceCount > 0.8) score += 20;

      return Math.min(100, score);
    });

    return Math.round(
      qualityFactors.reduce((sum, score) => sum + score, 0) / scripts.length
    );
  }

  private calculateProductivityTrend(
    scripts: any[],
    recordings: any[]
  ): UserContext["productivityTrend"] {
    // Analyser l'activité sur les 30 derniers jours
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;

    const recentScripts = scripts.filter(
      (s) => new Date(s.createdAt).getTime() > fifteenDaysAgo
    );
    const olderScripts = scripts.filter(
      (s) =>
        new Date(s.createdAt).getTime() > thirtyDaysAgo &&
        new Date(s.createdAt).getTime() <= fifteenDaysAgo
    );

    if (recentScripts.length > olderScripts.length * 1.2) return "increasing";
    if (recentScripts.length < olderScripts.length * 0.8) return "decreasing";
    return "stable";
  }

  private assessSkillLevel(
    scripts: any[],
    recordings: any[]
  ): UserContext["skillLevel"] {
    const totalContent = scripts.length + recordings.length;
    const avgQuality = this.assessContentQuality(scripts);

    if (totalContent < 5) return "beginner";
    if (totalContent < 20 && avgQuality < 60) return "intermediate";
    if (totalContent < 50 && avgQuality < 80) return "advanced";
    return "expert";
  }

  private async inferPreferredTone(
    userId?: string,
    analytics?: any
  ): Promise<UserContext["preferredMessageTone"]> {
    // Analyser les interactions passées pour inférer le ton préféré
    if (!userId) return "casual";

    try {
      const interactions = await this.getMessageInteractionHistory(userId);
      const toneEngagement: Record<string, number> = {};

      // Analyser l'engagement par ton (simplification)
      interactions.forEach((interaction) => {
        // Ici, on devrait récupérer le ton du message depuis l'ID
        // Pour l'exemple, on simule
        const tone = "casual"; // À remplacer par la vraie logique
        toneEngagement[tone] = (toneEngagement[tone] || 0) + 1;
      });

      // Retourner le ton le plus engageant
      const preferredTone = Object.entries(toneEngagement).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0];

      return (preferredTone as UserContext["preferredMessageTone"]) || "casual";
    } catch {
      return "casual";
    }
  }

  private async getMessagePreferences(userId: string): Promise<any> {
    try {
      const key = `@message_preferences_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : this.getDefaultMessagePreferences();
    } catch {
      return this.getDefaultMessagePreferences();
    }
  }

  private getDefaultMessagePreferences(): any {
    return {
      preferredTypes: ["welcome", "tip", "achievement"],
      preferredTimes: ["morning", "evening"],
      frequencyLimit: 3,
      blockedCategories: [],
      customPreferences: {},
    };
  }

  private async calculateMilestones(
    userId?: string,
    scripts?: any[],
    recordings?: any[]
  ): Promise<MilestoneProgress[]> {
    const milestones: MilestoneProgress[] = [];

    // Milestone: Premier script
    if (scripts && scripts.length === 0) {
      milestones.push({
        id: "first_script",
        name: "Créer votre premier script",
        currentValue: 0,
        targetValue: 1,
        progress: 0,
        reward: "Badge Débutant",
      });
    }

    // Milestone: 10 scripts
    if (scripts) {
      milestones.push({
        id: "ten_scripts",
        name: "Créer 10 scripts",
        currentValue: scripts.length,
        targetValue: 10,
        progress: Math.min(1, scripts.length / 10),
        estimatedCompletionDate: this.estimateCompletionDate(
          scripts.length,
          10
        ),
        reward: "Badge Productif",
      });
    }

    // Milestone: 1000 mots
    const totalWords =
      scripts?.reduce(
        (sum, s) => sum + (s.content || "").split(/\s+/).length,
        0
      ) || 0;

    milestones.push({
      id: "thousand_words",
      name: "Écrire 1000 mots",
      currentValue: totalWords,
      targetValue: 1000,
      progress: Math.min(1, totalWords / 1000),
      estimatedCompletionDate: this.estimateCompletionDate(totalWords, 1000),
      reward: "Badge Écrivain",
    });

    return milestones;
  }

  private estimateCompletionDate(
    current: number,
    target: number
  ): string | undefined {
    if (current >= target) return undefined;

    // Estimation simple basée sur le rythme actuel
    const daysToComplete = Math.ceil(
      (target - current) / Math.max(current / 30, 0.5)
    );
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToComplete);

    return completionDate.toISOString();
  }

  private async getAchievements(userId?: string): Promise<Achievement[]> {
    if (!userId) return [];

    try {
      const key = `@achievements_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getDefaultContext(): UserContext {
    return {
      userId: "guest",
      userName: null,
      email: null,
      isFirstLogin: true,
      isReturningUser: false,
      daysSinceLastLogin: 0,
      loginFrequency: "rare",
      scriptsCount: 0,
      recordingsCount: 0,
      favoriteScriptsCount: 0,
      totalWordsWritten: 0,
      averageScriptLength: 0,
      mostUsedTopics: [],
      contentQualityScore: 0,
      consecutiveDays: 0,
      totalDaysActive: 0,
      engagementScore: 0,
      featureUsageMap: {},
      preferredFeatures: [],
      timeOfDay: "morning",
      dayOfWeek: "monday",
      season: "spring",
      isHoliday: false,
      timezone: "UTC",
      preferredLanguage: getDeviceLanguage(),
      preferredMessageTone: "casual",
      interactionHistory: [],
      messagePreferences: this.getDefaultMessagePreferences(),
      productivityTrend: "stable",
      milestoneProgress: [],
      achievements: [],
      skillLevel: "beginner",
      collaborationLevel: "solo",
      deviceType: "mobile",
      platform: "ios",
      appVersion: "1.0.0",
      lastActiveDate: new Date().toISOString(),
    };
  }
}
