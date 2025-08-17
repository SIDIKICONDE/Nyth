import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import {
  Challenge,
  DAILY_CHALLENGES,
  GamificationStats,
  Mission,
  MISSIONS,
  POINT_ACTIONS,
  PointAction,
  Streak,
  WEEKLY_CHALLENGES,
  XP_LEVELS,
  calculateLevel,
} from "../types/achievements";

const STORAGE_KEYS = {
  POINTS: "user_points",
  STREAKS: "user_streaks",
  CHALLENGES: "user_challenges",
  MISSIONS: "user_missions",
  DAILY_ACTIONS: "daily_action_counts",
  STATS: "gamification_stats",
};

class GamificationService {
  private userId: string | null = null;
  private dailyActionCounts: Map<string, number> = new Map();
  private lastResetDate: Date | null = null;

  /**
   * Initialiser le service pour un utilisateur
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadDailyActionCounts();
    await this.checkAndResetDaily();
    await this.checkStreaks();
  }

  /**
   * Enregistrer une action et attribuer des points
   */
  async recordAction(actionId: string, metadata?: any): Promise<{
    pointsEarned: number;
    xpEarned: number;
    multiplier: number;
    message?: string;
  }> {
    const action = POINT_ACTIONS.find((a) => a.id === actionId);
    if (!action) {
      return { pointsEarned: 0, xpEarned: 0, multiplier: 1 };
    }

    // Vérifier la limite quotidienne
    if (action.dailyLimit) {
      const currentCount = this.dailyActionCounts.get(actionId) || 0;
      if (currentCount >= action.dailyLimit) {
        return {
          pointsEarned: 0,
          xpEarned: 0,
          multiplier: 1,
          message: "Limite quotidienne atteinte",
        };
      }
      this.dailyActionCounts.set(actionId, currentCount + 1);
      await this.saveDailyActionCounts();
    }

    // Calculer le multiplicateur basé sur les streaks
    const streaks = await this.getStreaks();
    let multiplier = 1;
    
    // Bonus de streak pour connexion quotidienne
    if (streaks.find((s) => s.type === "daily_login")?.currentStreak || 0 > 0) {
      const loginStreak = streaks.find((s) => s.type === "daily_login")!;
      multiplier += Math.min(loginStreak.currentStreak * 0.1, 2); // Max 3x
    }

    // Calculer les points avec multiplicateur
    const basePoints = action.points;
    const pointsEarned = Math.floor(basePoints * multiplier);

    // Calculer l'XP basé sur le tier du joueur
    const stats = await this.getStats();
    const tierMultiplier = XP_LEVELS[stats.level.tier || "bronze"].multiplier;
    const xpEarned = Math.floor(pointsEarned * 0.1 * tierMultiplier);

    // Sauvegarder les points
    await this.addPoints(pointsEarned);
    await this.addXP(xpEarned);

    // Mettre à jour les défis
    await this.updateChallenges(actionId, metadata);

    // Mettre à jour les missions
    await this.updateMissions(actionId, metadata);

    return { pointsEarned, xpEarned, multiplier, message: action.name };
  }

  /**
   * Obtenir les défis actifs
   */
  async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGES);
      if (stored) {
        const challenges = JSON.parse(stored) as Challenge[];
        // Filtrer les défis expirés
        const now = new Date();
        return challenges.filter((c) => new Date(c.expiresAt) > now && !c.isCompleted);
      }
      
      // Générer de nouveaux défis
      return await this.generateNewChallenges();
    } catch (error) {
      return [];
    }
  }

  /**
   * Générer de nouveaux défis quotidiens/hebdomadaires
   */
  private async generateNewChallenges(): Promise<Challenge[]> {
    const now = new Date();
    const challenges: Challenge[] = [];

    // Sélectionner 3 défis quotidiens aléatoires
    const dailyPool = [...DAILY_CHALLENGES];
    for (let i = 0; i < 3 && dailyPool.length > 0; i++) {
      const index = Math.floor(Math.random() * dailyPool.length);
      const template = dailyPool.splice(index, 1)[0];
      
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      challenges.push({
        ...template,
        currentValue: 0,
        expiresAt: endOfDay,
        isCompleted: false,
      });
    }

    // Sélectionner 2 défis hebdomadaires
    const weeklyPool = [...WEEKLY_CHALLENGES];
    for (let i = 0; i < 2 && weeklyPool.length > 0; i++) {
      const index = Math.floor(Math.random() * weeklyPool.length);
      const template = weeklyPool.splice(index, 1)[0];
      
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      
      challenges.push({
        ...template,
        currentValue: 0,
        expiresAt: endOfWeek,
        isCompleted: false,
      });
    }

    await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    return challenges;
  }

  /**
   * Mettre à jour la progression des défis
   */
  private async updateChallenges(actionId: string, metadata?: any): Promise<void> {
    const challenges = await this.getActiveChallenges();
    let updated = false;

    for (const challenge of challenges) {
      if (challenge.isCompleted) continue;

      // Logique de mise à jour selon l'action
      switch (challenge.id) {
        case "daily_script":
        case "weekly_marathon":
          if (actionId === "create_script") {
            challenge.currentValue++;
            updated = true;
          }
          break;
        
        case "daily_recording":
        case "weekly_video_master":
          if (actionId === "record_video") {
            challenge.currentValue++;
            updated = true;
          }
          break;
        
        case "daily_quality":
          if (actionId === "record_hd_video" || metadata?.quality === "HD" || metadata?.quality === "4K") {
            challenge.currentValue++;
            updated = true;
          }
          break;
        
        case "daily_share":
        case "weekly_social":
          if (actionId === "share_script" || actionId === "share_video") {
            challenge.currentValue++;
            updated = true;
          }
          break;
        
        case "daily_ai":
          if (actionId === "use_ai_feature") {
            challenge.currentValue++;
            updated = true;
          }
          break;
        
        case "weekly_time":
          if (actionId === "record_video" && metadata?.duration) {
            challenge.currentValue += metadata.duration;
            updated = true;
          }
          break;
      }

      // Vérifier si le défi est complété
      if (challenge.currentValue >= challenge.requiredValue) {
        challenge.isCompleted = true;
        await this.completeChallenge(challenge);
      }
    }

    if (updated) {
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    }
  }

  /**
   * Compléter un défi
   */
  private async completeChallenge(challenge: Challenge): Promise<void> {
    // Attribuer les récompenses
    await this.addPoints(challenge.pointsReward);
    await this.addXP(challenge.xpReward);

    // Synchroniser avec Firebase si connecté
    if (this.userId) {
      try {
        await firestore()
          .collection("completedChallenges")
          .add({
            userId: this.userId,
            challengeId: challenge.id,
            completedAt: firestore.FieldValue.serverTimestamp(),
            xpEarned: challenge.xpReward,
            pointsEarned: challenge.pointsReward,
          });
      } catch (error) {}
    }
  }

  /**
   * Gérer les streaks
   */
  async getStreaks(): Promise<Streak[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.STREAKS);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Initialiser les streaks
      const defaultStreaks: Streak[] = [
        {
          type: "daily_login",
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          multiplier: 1,
        },
        {
          type: "daily_recording",
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          multiplier: 1,
        },
        {
          type: "daily_script",
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          multiplier: 1,
        },
        {
          type: "weekly_activity",
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          multiplier: 1,
        },
      ];
      
      await AsyncStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(defaultStreaks));
      return defaultStreaks;
    } catch (error) {
      return [];
    }
  }

  /**
   * Mettre à jour un streak
   */
  async updateStreak(type: Streak["type"]): Promise<void> {
    const streaks = await this.getStreaks();
    const streak = streaks.find((s) => s.type === type);
    
    if (!streak) return;

    const now = new Date();
    const lastActivity = new Date(streak.lastActivityDate);
    const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Même jour, ne rien faire
      return;
    } else if (daysDiff === 1) {
      // Jour suivant, continuer le streak
      streak.currentStreak++;
      streak.longestStreak = Math.max(streak.currentStreak, streak.longestStreak);
      streak.multiplier = 1 + Math.min(streak.currentStreak * 0.1, 2); // Max 3x
    } else {
      // Streak cassé
      streak.currentStreak = 1;
      streak.multiplier = 1;
    }

    streak.lastActivityDate = now;
    await AsyncStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streaks));
  }

  /**
   * Vérifier et réinitialiser les streaks si nécessaire
   */
  private async checkStreaks(): Promise<void> {
    const streaks = await this.getStreaks();
    const now = new Date();
    let updated = false;

    for (const streak of streaks) {
      const lastActivity = new Date(streak.lastActivityDate);
      const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 1) {
        // Streak cassé
        streak.currentStreak = 0;
        streak.multiplier = 1;
        updated = true;
      }
    }

    if (updated) {
      await AsyncStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streaks));
    }
  }

  /**
   * Obtenir les missions actives
   */
  async getActiveMissions(): Promise<Mission[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MISSIONS);
      if (stored) {
        return JSON.parse(stored);
      }

      // Charger les missions par défaut
      const defaultMissions: Mission[] = MISSIONS.map((m) => ({
        ...m,
        isActive: true,
        isCompleted: false,
      }));

      await AsyncStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(defaultMissions));
      return defaultMissions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Mettre à jour la progression des missions
   */
  private async updateMissions(actionId: string, metadata?: any): Promise<void> {
    const missions = await this.getActiveMissions();
    let updated = false;

    for (const mission of missions) {
      if (mission.isCompleted) continue;

      for (const step of mission.steps) {
        if (step.isCompleted) continue;

        // Logique spécifique par mission et étape
        let shouldUpdate = false;
        
        switch (mission.id) {
          case "mission_first_week":
            if (step.id === "step1" && actionId === "create_script") shouldUpdate = true;
            if (step.id === "step2" && actionId === "record_video") shouldUpdate = true;
            if (step.id === "step3" && actionId === "complete_profile") shouldUpdate = true;
            if (step.id === "step4" && actionId === "use_teleprompter") shouldUpdate = true;
            if (step.id === "step5" && (actionId === "share_script" || actionId === "share_video")) shouldUpdate = true;
            break;
          
          // Ajouter d'autres missions...
        }

        if (shouldUpdate) {
          step.currentValue++;
          if (step.currentValue >= step.requiredValue) {
            step.isCompleted = true;
          }
          updated = true;
        }
      }

      // Vérifier si la mission est complétée
      if (mission.steps.every((s) => s.isCompleted)) {
        mission.isCompleted = true;
        mission.completedAt = new Date();
        await this.completeMission(mission);
      }
    }

    if (updated) {
      await AsyncStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
    }
  }

  /**
   * Compléter une mission
   */
  private async completeMission(mission: Mission): Promise<void> {
    // Attribuer les récompenses
    await this.addPoints(mission.totalPointsReward);
    await this.addXP(mission.totalXpReward);

    // TODO: Débloquer le badge associé si défini
    if (mission.unlockedBadgeId) {
      // Logique pour débloquer le badge
    }

    // Synchroniser avec Firebase
    if (this.userId) {
      try {
        await firestore()
          .collection("completedMissions")
          .add({
            userId: this.userId,
            missionId: mission.id,
            completedAt: firestore.FieldValue.serverTimestamp(),
            xpEarned: mission.totalXpReward,
            pointsEarned: mission.totalPointsReward,
          });
      } catch (error) {}
    }
  }

  /**
   * Obtenir les statistiques de gamification
   */
  async getStats(): Promise<GamificationStats> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      if (stored) {
        const stats = JSON.parse(stored);
        // Recalculer le niveau au cas où
        stats.level = calculateLevel(stats.totalXP);
        return stats;
      }

      // Stats par défaut
      const defaultStats: GamificationStats = {
        totalPoints: 0,
        totalXP: 0,
        level: calculateLevel(0),
        achievementsUnlocked: 0,
        totalAchievements: 0,
        streaks: await this.getStreaks(),
        completedChallenges: 0,
        completedMissions: 0,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(defaultStats));
      return defaultStats;
    } catch (error) {
      return {
        totalPoints: 0,
        totalXP: 0,
        level: calculateLevel(0),
        achievementsUnlocked: 0,
        totalAchievements: 0,
        streaks: [],
        completedChallenges: 0,
        completedMissions: 0,
      };
    }
  }

  /**
   * Ajouter des points
   */
  private async addPoints(points: number): Promise<void> {
    const stats = await this.getStats();
    stats.totalPoints += points;
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }

  /**
   * Ajouter de l'XP
   */
  private async addXP(xp: number): Promise<void> {
    const stats = await this.getStats();
    const oldLevel = stats.level.level;
    stats.totalXP += xp;
    stats.level = calculateLevel(stats.totalXP);
    
    // Vérifier si niveau augmenté
    if (stats.level.level > oldLevel) {}
    
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }

  /**
   * Charger les compteurs d'actions quotidiennes
   */
  private async loadDailyActionCounts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_ACTIONS);
      if (stored) {
        const data = JSON.parse(stored);
        this.dailyActionCounts = new Map(Object.entries(data.counts));
        this.lastResetDate = new Date(data.lastReset);
      }
    } catch (error) {}
  }

  /**
   * Sauvegarder les compteurs d'actions quotidiennes
   */
  private async saveDailyActionCounts(): Promise<void> {
    try {
      const data = {
        counts: Object.fromEntries(this.dailyActionCounts),
        lastReset: this.lastResetDate || new Date(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_ACTIONS, JSON.stringify(data));
    } catch (error) {}
  }

  /**
   * Vérifier et réinitialiser les éléments quotidiens
   */
  private async checkAndResetDaily(): Promise<void> {
    const now = new Date();
    
    if (!this.lastResetDate || 
        now.getDate() !== this.lastResetDate.getDate() ||
        now.getMonth() !== this.lastResetDate.getMonth() ||
        now.getFullYear() !== this.lastResetDate.getFullYear()) {
      
      // Nouveau jour, réinitialiser
      this.dailyActionCounts.clear();
      this.lastResetDate = now;
      await this.saveDailyActionCounts();
      
      // Générer de nouveaux défis quotidiens
      await this.generateNewChallenges();
    }
  }

  /**
   * Obtenir le classement (leaderboard)
   */
  async getLeaderboard(): Promise<any[]> {
    if (!this.userId) return [];

    try {
      const snapshot = await firestore()
        .collection("userAchievementsMeta")
        .orderBy("totalXP", "desc")
        .limit(100)
        .get();

      return snapshot.docs.map((doc, index) => ({
        rank: index + 1,
        userId: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      return [];
    }
  }
}

export const gamificationService = new GamificationService();