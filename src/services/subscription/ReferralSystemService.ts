import { createLogger } from "../../utils/optimizedLogger";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "@react-native-firebase/firestore";
import { UserSubscription, UsageStats } from "../../types/subscription";

const logger = createLogger("ReferralSystemService");

interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  totalUses: number;
  maxUses: number;
}

interface ReferralReward {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCodeId: string;
  status: 'pending' | 'qualified' | 'completed' | 'expired' | 'cancelled';
  rewardType: 'free_month' | 'discount_50' | 'api_credits' | 'priority_support';
  rewardValue: number;
  createdAt: string;
  qualifiedAt?: string;
  completedAt?: string;
  expiresAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  conversionRate: number;
  averageTimeToConvert: number;
  topReferrers: Array<{
    userId: string;
    totalReferrals: number;
    successfulReferrals: number;
  }>;
}

interface RewardConfig {
  type: ReferralReward['rewardType'];
  name: string;
  description: string;
  value: number;
  durationDays: number;
  conditions: {
    referredUserMinDays: number;
    referredUserMinUsage: number;
    referrerMinDays: number;
  };
}

/**
 * Service de système de parrainage avec récompenses
 * Gère les codes de parrainage, le tracking et les récompenses
 */
class ReferralSystemService {
  private static instance: ReferralSystemService;
  private db = getFirestore(getApp());

  // Configuration des récompenses
  private rewardConfigs: Record<string, RewardConfig> = {
    free_month: {
      type: 'free_month',
      name: 'Mois Gratuit',
      description: 'Un mois d\'abonnement gratuit sur votre prochain renouvellement',
      value: 30,
      durationDays: 365,
      conditions: {
        referredUserMinDays: 30,
        referredUserMinUsage: 100,
        referrerMinDays: 7,
      },
    },
    discount_50: {
      type: 'discount_50',
      name: '50% de Réduction',
      description: '50% de réduction sur votre prochain mois',
      value: 50,
      durationDays: 30,
      conditions: {
        referredUserMinDays: 14,
        referredUserMinUsage: 50,
        referrerMinDays: 3,
      },
    },
    api_credits: {
      type: 'api_credits',
      name: 'Crédits API Bonus',
      description: '1000 crédits API supplémentaires',
      value: 1000,
      durationDays: 90,
      conditions: {
        referredUserMinDays: 7,
        referredUserMinUsage: 25,
        referrerMinDays: 1,
      },
    },
    priority_support: {
      type: 'priority_support',
      name: 'Support Prioritaire',
      description: 'Support prioritaire pendant 3 mois',
      value: 90,
      durationDays: 90,
      conditions: {
        referredUserMinDays: 1,
        referredUserMinUsage: 10,
        referrerMinDays: 1,
      },
    },
  };

  static getInstance(): ReferralSystemService {
    if (!ReferralSystemService.instance) {
      ReferralSystemService.instance = new ReferralSystemService();
    }
    return ReferralSystemService.instance;
  }

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      logger.info("🔗 Service de parrainage initialisé");
    } catch (error) {
      logger.error("❌ Erreur initialisation service parrainage:", error);
    }
  }

  /**
   * Génère un code de parrainage unique pour un utilisateur
   */
  async generateReferralCode(userId: string, maxUses: number = 10): Promise<string> {
    try {
      // Générer un code unique
      const code = this.generateUniqueCode();

      const referralCode: ReferralCode = {
        id: `${userId}_${Date.now()}`,
        userId,
        code,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
        isActive: true,
        totalUses: 0,
        maxUses,
      };

      // Sauvegarder dans Firestore
      await setDoc(doc(this.db, 'referral_codes', referralCode.id), {
        ...referralCode,
        createdAt: serverTimestamp(),
        expiresAt: serverTimestamp(), // Sera mis à jour avec la vraie date
      });

      // Mettre à jour la date d'expiration correctement
      await updateDoc(doc(this.db, 'referral_codes', referralCode.id), {
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      logger.info("✅ Code de parrainage généré:", code, "pour:", userId);
      return code;

    } catch (error) {
      logger.error("❌ Erreur génération code de parrainage:", error);
      throw error;
    }
  }

  /**
   * Utilise un code de parrainage lors de l'inscription
   */
  async useReferralCode(referredUserId: string, referralCode: string): Promise<boolean> {
    try {
      // Vérifier si le code existe et est valide
      const codeDoc = await this.getReferralCodeByCode(referralCode);

      if (!codeDoc) {
        logger.warn("⚠️ Code de parrainage introuvable:", referralCode);
        return false;
      }

      if (!codeDoc.isActive) {
        logger.warn("⚠️ Code de parrainage inactif:", referralCode);
        return false;
      }

      if (codeDoc.totalUses >= codeDoc.maxUses) {
        logger.warn("⚠️ Code de parrainage épuisé:", referralCode);
        return false;
      }

      if (new Date() > new Date(codeDoc.expiresAt)) {
        logger.warn("⚠️ Code de parrainage expiré:", referralCode);
        return false;
      }

      // Vérifier que l'utilisateur ne s'est pas déjà fait parrainer
      const existingReferral = await this.getReferralByReferredUser(referredUserId);
      if (existingReferral) {
        logger.warn("⚠️ Utilisateur déjà parrainé:", referredUserId);
        return false;
      }

      // Créer la récompense en attente
      const reward: ReferralReward = {
        id: `${codeDoc.userId}_${referredUserId}_${Date.now()}`,
        referrerUserId: codeDoc.userId,
        referredUserId,
        referralCodeId: codeDoc.id,
        status: 'pending',
        rewardType: this.selectRewardType(codeDoc.totalUses),
        rewardValue: this.rewardConfigs[this.selectRewardType(codeDoc.totalUses)].value,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours
      };

      // Sauvegarder la récompense
      await setDoc(doc(this.db, 'referral_rewards', reward.id), {
        ...reward,
        createdAt: serverTimestamp(),
        expiresAt: serverTimestamp(),
      });

      // Mettre à jour la date d'expiration
      await updateDoc(doc(this.db, 'referral_rewards', reward.id), {
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });

      // Incrémenter l'utilisation du code
      await updateDoc(doc(this.db, 'referral_codes', codeDoc.id), {
        totalUses: increment(1),
      });

      logger.info("✅ Code de parrainage utilisé:", referralCode, "par:", referredUserId);
      return true;

    } catch (error) {
      logger.error("❌ Erreur utilisation code de parrainage:", error);
      return false;
    }
  }

  /**
   * Vérifie si une récompense est qualifiée
   */
  async checkRewardQualification(rewardId: string): Promise<boolean> {
    try {
      const rewardDoc = await getDoc(doc(this.db, 'referral_rewards', rewardId));
      if (!rewardDoc.exists()) return false;

      const reward = rewardDoc.data() as ReferralReward;
      if (reward.status !== 'pending') return false;

      // Vérifier les conditions
      const config = this.rewardConfigs[reward.rewardType];
      const now = new Date();
      const referredUserAge = now.getTime() - new Date(reward.createdAt).getTime();
      const referredUserAgeDays = referredUserAge / (1000 * 60 * 60 * 24);

      if (referredUserAgeDays < config.conditions.referredUserMinDays) {
        return false;
      }

      // Vérifier l'usage du parrainé
      const usage = await this.getUserUsageStats(reward.referredUserId);
      if (!usage || usage.generations.total < config.conditions.referredUserMinUsage) {
        return false;
      }

      // Marquer comme qualifié
      await updateDoc(doc(this.db, 'referral_rewards', rewardId), {
        status: 'qualified',
        qualifiedAt: new Date().toISOString(),
      });

      logger.info("✅ Récompense qualifiée:", rewardId);
      return true;

    } catch (error) {
      logger.error("❌ Erreur vérification qualification récompense:", error);
      return false;
    }
  }

  /**
   * Distribue une récompense qualifiée
   */
  async distributeReward(rewardId: string): Promise<boolean> {
    try {
      const rewardDoc = await getDoc(doc(this.db, 'referral_rewards', rewardId));
      if (!rewardDoc.exists()) return false;

      const reward = rewardDoc.data() as ReferralReward;
      if (reward.status !== 'qualified') return false;

      // Appliquer la récompense selon le type
      await this.applyReward(reward);

      // Marquer comme complété
      await updateDoc(doc(this.db, 'referral_rewards', rewardId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      logger.info("✅ Récompense distribuée:", rewardId);
      return true;

    } catch (error) {
      logger.error("❌ Erreur distribution récompense:", error);
      return false;
    }
  }

  /**
   * Obtient les statistiques de parrainage d'un utilisateur
   */
  async getUserReferralStats(userId: string): Promise<{
    referralCode: string | null;
    totalReferrals: number;
    pendingRewards: number;
    qualifiedRewards: number;
    completedRewards: number;
    totalEarnings: number;
  }> {
    try {
      // Obtenir le code de parrainage
      const codeDoc = await this.getReferralCodeByUserId(userId);
      const referralCode = codeDoc?.code || null;

      // Obtenir les récompenses
      const rewardsQuery = query(
        collection(this.db, 'referral_rewards'),
        where('referrerUserId', '==', userId)
      );
      const rewardsSnapshot = await getDocs(rewardsQuery);
      const rewards = rewardsSnapshot.docs.map(doc => doc.data() as ReferralReward);

      const totalReferrals = rewards.length;
      const pendingRewards = rewards.filter(r => r.status === 'pending').length;
      const qualifiedRewards = rewards.filter(r => r.status === 'qualified').length;
      const completedRewards = rewards.filter(r => r.status === 'completed').length;
      const totalEarnings = rewards
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.rewardValue, 0);

      return {
        referralCode,
        totalReferrals,
        pendingRewards,
        qualifiedRewards,
        completedRewards,
        totalEarnings,
      };

    } catch (error) {
      logger.error("❌ Erreur récupération stats parrainage:", error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques globales de parrainage
   */
  async getGlobalReferralStats(): Promise<ReferralStats> {
    try {
      // Statistiques des codes
      const codesQuery = query(collection(this.db, 'referral_codes'));
      const codesSnapshot = await getDocs(codesQuery);
      const codes = codesSnapshot.docs.map(doc => doc.data() as ReferralCode);

      // Statistiques des récompenses
      const rewardsQuery = query(collection(this.db, 'referral_rewards'));
      const rewardsSnapshot = await getDocs(rewardsQuery);
      const rewards = rewardsSnapshot.docs.map(doc => doc.data() as ReferralReward);

      const totalReferrals = rewards.length;
      const activeReferrals = rewards.filter(r => r.status === 'pending' || r.status === 'qualified').length;
      const completedReferrals = rewards.filter(r => r.status === 'completed').length;
      const totalRewards = rewards
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.rewardValue, 0);

      const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

      // Top referrers
      const referrerStats = new Map<string, { total: number; successful: number }>();
      rewards.forEach(reward => {
        const stats = referrerStats.get(reward.referrerUserId) || { total: 0, successful: 0 };
        stats.total++;
        if (reward.status === 'completed') stats.successful++;
        referrerStats.set(reward.referrerUserId, stats);
      });

      const topReferrers = Array.from(referrerStats.entries())
        .map(([userId, stats]) => ({
          userId,
          totalReferrals: stats.total,
          successfulReferrals: stats.successful,
        }))
        .sort((a, b) => b.successfulReferrals - a.successfulReferrals)
        .slice(0, 10);

      return {
        totalReferrals,
        activeReferrals,
        completedReferrals,
        totalRewards,
        conversionRate,
        averageTimeToConvert: 0, // À calculer avec les dates
        topReferrers,
      };

    } catch (error) {
      logger.error("❌ Erreur récupération stats globales:", error);
      throw error;
    }
  }

  // Méthodes utilitaires privées

  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async getReferralCodeByCode(code: string): Promise<ReferralCode | null> {
    try {
      const q = query(
        collection(this.db, 'referral_codes'),
        where('code', '==', code)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ReferralCode;
    } catch (error) {
      logger.error("❌ Erreur recherche code:", error);
      return null;
    }
  }

  private async getReferralCodeByUserId(userId: string): Promise<ReferralCode | null> {
    try {
      const q = query(
        collection(this.db, 'referral_codes'),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ReferralCode;
    } catch (error) {
      logger.error("❌ Erreur recherche code utilisateur:", error);
      return null;
    }
  }

  private async getReferralByReferredUser(referredUserId: string): Promise<ReferralReward | null> {
    try {
      const q = query(
        collection(this.db, 'referral_rewards'),
        where('referredUserId', '==', referredUserId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ReferralReward;
    } catch (error) {
      logger.error("❌ Erreur recherche parrainage:", error);
      return null;
    }
  }

  private async getUserUsageStats(userId: string): Promise<UsageStats | null> {
    try {
      const usageDoc = await getDoc(doc(this.db, 'usage_stats', userId));
      if (!usageDoc.exists()) return null;
      return usageDoc.data() as UsageStats;
    } catch (error) {
      logger.error("❌ Erreur récupération usage:", error);
      return null;
    }
  }

  private selectRewardType(currentUses: number): ReferralReward['rewardType'] {
    // Logique pour sélectionner le type de récompense selon les usages
    if (currentUses < 3) return 'free_month';
    if (currentUses < 7) return 'discount_50';
    return 'api_credits';
  }

  private async applyReward(reward: ReferralReward): Promise<void> {
    try {
      const config = this.rewardConfigs[reward.rewardType];

      switch (reward.rewardType) {
        case 'free_month':
          // Ajouter un mois gratuit à l'abonnement
          await this.addFreeMonth(reward.referrerUserId, reward.rewardValue);
          break;

        case 'discount_50':
          // Appliquer une réduction de 50%
          await this.applyDiscount(reward.referrerUserId, reward.rewardValue);
          break;

        case 'api_credits':
          // Ajouter des crédits API
          await this.addApiCredits(reward.referrerUserId, reward.rewardValue);
          break;

        case 'priority_support':
          // Activer le support prioritaire
          await this.enablePrioritySupport(reward.referrerUserId, reward.rewardValue);
          break;
      }

      logger.info("✅ Récompense appliquée:", reward.rewardType, "pour:", reward.referrerUserId);

    } catch (error) {
      logger.error("❌ Erreur application récompense:", error);
      throw error;
    }
  }

  private async addFreeMonth(userId: string, days: number): Promise<void> {
    // Logique pour ajouter des jours gratuits à l'abonnement
    await updateDoc(doc(this.db, 'user_rewards', userId), {
      freeDays: increment(days),
      lastReward: serverTimestamp(),
    });
  }

  private async applyDiscount(userId: string, percentage: number): Promise<void> {
    // Logique pour appliquer une réduction
    await updateDoc(doc(this.db, 'user_rewards', userId), {
      discountPercentage: percentage,
      discountExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastReward: serverTimestamp(),
    });
  }

  private async addApiCredits(userId: string, credits: number): Promise<void> {
    // Logique pour ajouter des crédits API
    await updateDoc(doc(this.db, 'user_rewards', userId), {
      apiCredits: increment(credits),
      lastReward: serverTimestamp(),
    });
  }

  private async enablePrioritySupport(userId: string, days: number): Promise<void> {
    // Logique pour activer le support prioritaire
    await updateDoc(doc(this.db, 'user_rewards', userId), {
      prioritySupport: true,
      prioritySupportExpiry: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      lastReward: serverTimestamp(),
    });
  }
}

export const referralSystemService = ReferralSystemService.getInstance();
export default referralSystemService;
