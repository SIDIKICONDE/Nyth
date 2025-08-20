import { createLogger } from "../../utils/optimizedLogger";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { UserSubscription, UsageStats } from "../../types/subscription";

const logger = createLogger("PredictiveAnalyticsService");

interface UserBehavior {
  userId: string;
  lastActive: string;
  totalSessions: number;
  averageSessionDuration: number;
  featuresUsed: string[];
  lastPaymentDate?: string;
  subscriptionAge: number; // en jours
  planValue: number;
  usageTrend: 'increasing' | 'stable' | 'decreasing';
  supportTickets: number;
  apiErrors: number;
}

interface ChurnRisk {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  riskFactors: string[];
  predictedChurnDate: string;
  recommendations: string[];
  lastUpdated: string;
}

interface RetentionInsight {
  insightType: 'at_risk' | 'upgrading' | 'downgrading' | 'engagement_drop';
  userId: string;
  description: string;
  confidence: number; // 0-100
  actionItems: string[];
  priority: 'low' | 'medium' | 'high';
}

interface UsagePattern {
  userId: string;
  dailyUsage: number[];
  weeklyUsage: number[];
  monthlyUsage: number[];
  preferredTimes: string[]; // 'morning', 'afternoon', 'evening', 'night'
  preferredFeatures: string[];
  usageFrequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
}

interface PredictiveMetrics {
  churnRate: number;
  predictedRevenue: number;
  retentionRate: number;
  averageLifetimeValue: number;
  atRiskUsers: number;
  insightsGenerated: number;
}

/**
 * Service d'analytics prédictifs pour la détection du churn et l'optimisation de la rétention
 */
class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  private db = getFirestore(getApp());

  // Seuils de risque de churn
  private riskThresholds = {
    low: 20,
    medium: 40,
    high: 70,
    critical: 90,
  };

  // Facteurs de risque avec leurs poids
  private riskFactors = {
    inactivity_days: { weight: 0.3, threshold: 7 },
    usage_drop: { weight: 0.25, threshold: 50 }, // % de baisse
    payment_issues: { weight: 0.2, threshold: 1 }, // nombre d'échecs
    support_tickets: { weight: 0.15, threshold: 3 },
    plan_downgrade: { weight: 0.1, threshold: 1 },
  };

  static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      logger.info("🔮 Service d'analytics prédictifs initialisé");

      // Lancer l'analyse prédictive toutes les 6 heures
      setInterval(() => {
        this.runPredictiveAnalysis();
      }, 6 * 60 * 60 * 1000);

    } catch (error) {
      logger.error("❌ Erreur initialisation analytics prédictifs:", error);
    }
  }

  /**
   * Lance une analyse prédictive complète
   */
  async runPredictiveAnalysis(): Promise<void> {
    try {
      logger.info("🔮 Début analyse prédictive...");

      // 1. Analyser les comportements utilisateurs
      const users = await this.getActiveUsers();
      const behaviors = await Promise.all(users.map(user => this.analyzeUserBehavior(user)));

      // 2. Calculer les risques de churn
      const churnRisks = behaviors.map(behavior => this.calculateChurnRisk(behavior));

      // 3. Générer des insights de rétention
      const insights = await this.generateRetentionInsights(churnRisks);

      // 4. Sauvegarder les résultats
      await this.saveAnalyticsResults(churnRisks, insights);

      // 5. Déclencher des actions automatiques
      await this.triggerAutomatedActions(churnRisks);

      logger.info(`✅ Analyse prédictive terminée: ${churnRisks.length} risques calculés, ${insights.length} insights générés`);

    } catch (error) {
      logger.error("❌ Erreur analyse prédictive:", error);
    }
  }

  /**
   * Analyse le comportement d'un utilisateur
   */
  private async analyzeUserBehavior(user: any): Promise<UserBehavior> {
    try {
      const userId = user.id;
      const now = new Date();

      // Récupérer les données utilisateur
      const subscription = await this.getUserSubscription(userId);
      const usageStats = await this.getUserUsageStats(userId);
      const userSessions = await this.getUserSessions(userId);
      const supportTickets = await this.getUserSupportTickets(userId);

      // Calculer l'âge de l'abonnement
      const subscriptionAge = subscription ?
        Math.floor((now.getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      // Déterminer la tendance d'usage
      const usageTrend = this.calculateUsageTrend(usageStats);

      // Calculer la durée moyenne de session
      const averageSessionDuration = userSessions.length > 0 ?
        userSessions.reduce((sum, session) => sum + session.duration, 0) / userSessions.length : 0;

      return {
        userId,
        lastActive: user.lastActive?.toISOString() || now.toISOString(),
        totalSessions: userSessions.length,
        averageSessionDuration,
        featuresUsed: await this.getUserFeaturesUsed(userId),
        lastPaymentDate: subscription?.startDate,
        subscriptionAge,
        planValue: this.getPlanValue(subscription?.planId || 'free'),
        usageTrend,
        supportTickets: supportTickets.length,
        apiErrors: await this.getUserApiErrors(userId),
      };

    } catch (error) {
      logger.error(`❌ Erreur analyse comportement utilisateur ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Calcule le risque de churn pour un utilisateur
   */
  private calculateChurnRisk(behavior: UserBehavior): ChurnRisk {
    let riskScore = 0;
    const riskFactors: string[] = [];
    const now = new Date();

    // 1. Facteur d'inactivité
    const daysSinceLastActive = Math.floor(
      (now.getTime() - new Date(behavior.lastActive).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActive > this.riskFactors.inactivity_days.threshold) {
      const inactivityRisk = Math.min(
        (daysSinceLastActive / 30) * this.riskFactors.inactivity_days.weight * 100,
        this.riskFactors.inactivity_days.weight * 100
      );
      riskScore += inactivityRisk;
      riskFactors.push(`Inactif depuis ${daysSinceLastActive} jours`);
    }

    // 2. Facteur de baisse d'usage
    if (behavior.usageTrend === 'decreasing') {
      riskScore += this.riskFactors.usage_drop.weight * 100;
      riskFactors.push('Baisse significative de l\'utilisation');
    }

    // 3. Facteur de problèmes de support
    if (behavior.supportTickets > this.riskFactors.support_tickets.threshold) {
      riskScore += this.riskFactors.support_tickets.weight * 100;
      riskFactors.push(`${behavior.supportTickets} tickets de support`);
    }

    // 4. Facteur de problèmes API
    if (behavior.apiErrors > 5) {
      riskScore += 0.1 * 100; // 10% de poids supplémentaire
      riskFactors.push(`${behavior.apiErrors} erreurs API`);
    }

    // 5. Facteur de valeur du plan (les plans gratuits ont plus de risque)
    if (behavior.planValue === 0) {
      riskScore += 0.15 * 100; // 15% de poids supplémentaire
      riskFactors.push('Plan gratuit');
    }

    // Limiter le score à 100
    riskScore = Math.min(riskScore, 100);

    // Déterminer le niveau de risque
    let riskLevel: ChurnRisk['riskLevel'] = 'low';
    if (riskScore >= this.riskThresholds.critical) riskLevel = 'critical';
    else if (riskScore >= this.riskThresholds.high) riskLevel = 'high';
    else if (riskScore >= this.riskThresholds.medium) riskLevel = 'medium';

    // Prédire la date de churn (simplifié)
    const predictedChurnDate = new Date(now.getTime() + (30 - daysSinceLastActive) * 24 * 60 * 60 * 1000).toISOString();

    // Générer des recommandations
    const recommendations = this.generateRiskRecommendations(riskLevel, riskFactors, behavior);

    return {
      userId: behavior.userId,
      riskLevel,
      riskScore,
      riskFactors,
      predictedChurnDate,
      recommendations,
      lastUpdated: now.toISOString(),
    };
  }

  /**
   * Génère des insights de rétention
   */
  private async generateRetentionInsights(churnRisks: ChurnRisk[]): Promise<RetentionInsight[]> {
    const insights: RetentionInsight[] = [];

    for (const risk of churnRisks) {
      if (risk.riskLevel === 'high' || risk.riskLevel === 'critical') {
        insights.push({
          insightType: 'at_risk',
          userId: risk.userId,
          description: `Utilisateur à ${risk.riskLevel} risque de churn (${Math.round(risk.riskScore)}% de risque)`,
          confidence: Math.round(risk.riskScore),
          actionItems: risk.recommendations,
          priority: risk.riskLevel === 'critical' ? 'high' : 'medium',
        });
      }
    }

    // Insights basés sur les patterns d'usage
    const usagePatterns = await this.analyzeUsagePatterns();
    for (const pattern of usagePatterns) {
      if (pattern.usageFrequency === 'irregular') {
        insights.push({
          insightType: 'engagement_drop',
          userId: pattern.userId,
          description: 'Usage irrégulier détecté - risque d\'abandon',
          confidence: 75,
          actionItems: [
            'Envoyer email de réengagement',
            'Proposer tutoriel personnalisé',
            'Offrir réduction pour usage régulier',
          ],
          priority: 'medium',
        });
      }
    }

    return insights;
  }

  /**
   * Obtient les métriques prédictives globales
   */
  async getPredictiveMetrics(): Promise<PredictiveMetrics> {
    try {
      const churnRisks = await this.getAllChurnRisks();
      const insights = await this.getAllRetentionInsights();

      const totalUsers = churnRisks.length;
      const atRiskUsers = churnRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length;

      const churnRate = totalUsers > 0 ? (atRiskUsers / totalUsers) * 100 : 0;

      // Calculer le revenu prédit (simplifié)
      const predictedRevenue = await this.calculatePredictedRevenue(churnRisks);

      return {
        churnRate,
        predictedRevenue,
        retentionRate: 100 - churnRate,
        averageLifetimeValue: await this.calculateAverageLifetimeValue(),
        atRiskUsers,
        insightsGenerated: insights.length,
      };

    } catch (error) {
      logger.error("❌ Erreur calcul métriques prédictives:", error);
      throw error;
    }
  }

  /**
   * Obtient les utilisateurs à risque pour un niveau spécifique
   */
  async getAtRiskUsers(riskLevel: ChurnRisk['riskLevel'] = 'high'): Promise<ChurnRisk[]> {
    try {
      const allRisks = await this.getAllChurnRisks();
      return allRisks.filter(risk => {
        if (riskLevel === 'high') return risk.riskLevel === 'high' || risk.riskLevel === 'critical';
        if (riskLevel === 'critical') return risk.riskLevel === 'critical';
        return risk.riskLevel === riskLevel;
      }).sort((a, b) => b.riskScore - a.riskScore);

    } catch (error) {
      logger.error("❌ Erreur récupération utilisateurs à risque:", error);
      throw error;
    }
  }

  /**
   * Génère des recommandations de rétention personnalisées
   */
  async generatePersonalizedRecommendations(userId: string): Promise<string[]> {
    try {
      const behavior = await this.analyzeUserBehavior({ id: userId });
      const risk = this.calculateChurnRisk(behavior);

      const recommendations: string[] = [];

      // Recommandations basées sur le comportement
      if (behavior.usageTrend === 'decreasing') {
        recommendations.push('Proposer un plan adapté à votre usage actuel');
        recommendations.push('Offrir une session de formation personnalisée');
      }

      if (behavior.supportTickets > 0) {
        recommendations.push('Améliorer le support client avec un contact dédié');
      }

      if (behavior.planValue === 0) {
        recommendations.push('Offrir un essai gratuit étendu du plan Pro');
      }

      // Recommandations basées sur le risque
      if (risk.riskLevel === 'high' || risk.riskLevel === 'critical') {
        recommendations.push('Contact personnalisé sous 24h');
        recommendations.push('Offre de réduction exceptionnelle');
      }

      // Recommandations basées sur les features utilisées
      if (behavior.featuresUsed.includes('api_generation')) {
        recommendations.push('Proposer des templates API avancés');
      }

      return recommendations;

    } catch (error) {
      logger.error("❌ Erreur génération recommandations personnalisées:", error);
      return [];
    }
  }

  // Méthodes utilitaires privées

  private async getActiveUsers(): Promise<any[]> {
    try {
      const q = query(
        collection(this.db, 'users'),
        where('isActive', '==', true),
        orderBy('lastActive', 'desc'),
        limit(1000)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error("❌ Erreur récupération utilisateurs actifs:", error);
      return [];
    }
  }

  private async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const doc = await getDocs(query(collection(this.db, 'subscriptions'), where('userId', '==', userId)));
      if (doc.empty) return null;
      return doc.docs[0].data() as UserSubscription;
    } catch (error) {
      return null;
    }
  }

  private async getUserUsageStats(userId: string): Promise<UsageStats | null> {
    try {
      const doc = await getDocs(query(collection(this.db, 'usage_stats'), where('userId', '==', userId)));
      if (doc.empty) return null;
      return doc.docs[0].data() as UsageStats;
    } catch (error) {
      return null;
    }
  }

  private async getUserSessions(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(this.db, 'user_sessions'),
        where('userId', '==', userId),
        orderBy('startTime', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      return [];
    }
  }

  private async getUserSupportTickets(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(this.db, 'support_tickets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      return [];
    }
  }

  private async getUserFeaturesUsed(userId: string): Promise<string[]> {
    try {
      const q = query(
        collection(this.db, 'user_actions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const actions = snapshot.docs.map(doc => doc.data());
      return [...new Set(actions.map(action => action.feature))];
    } catch (error) {
      return [];
    }
  }

  private async getUserApiErrors(userId: string): Promise<number> {
    try {
      const q = query(
        collection(this.db, 'api_errors'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      return 0;
    }
  }

  private calculateUsageTrend(usageStats: UsageStats | null): UserBehavior['usageTrend'] {
    if (!usageStats) return 'stable';

    const recent = usageStats.generations.today;
    const previous = usageStats.generations.thisMonth;

    if (previous === 0) return 'increasing';

    const change = ((recent - previous) / previous) * 100;

    if (change > 20) return 'increasing';
    if (change < -20) return 'decreasing';
    return 'stable';
  }

  private getPlanValue(planId: string): number {
    const planValues = {
      'free': 0,
      'starter': 5,
      'pro': 15,
      'enterprise': 50,
    };
    return planValues[planId as keyof typeof planValues] || 0;
  }

  private generateRiskRecommendations(
    riskLevel: ChurnRisk['riskLevel'],
    riskFactors: string[],
    behavior: UserBehavior
  ): string[] {
    const recommendations: string[] = [];

    if (riskFactors.some(f => f.includes('Inactif'))) {
      recommendations.push('Envoyer email de réengagement avec tutoriel');
      recommendations.push('Proposer réduction pour réactivation');
    }

    if (riskLevel === 'critical') {
      recommendations.push('Contact téléphonique sous 24h');
      recommendations.push('Offre de migration gratuite vers Pro');
    }

    if (behavior.supportTickets > 0) {
      recommendations.push('Affecter un account manager dédié');
    }

    if (behavior.planValue === 0) {
      recommendations.push('Offre d\'essai gratuit étendu à 60 jours');
    }

    return recommendations;
  }

  private async analyzeUsagePatterns(): Promise<UsagePattern[]> {
    // Implémentation simplifiée - à développer selon les besoins
    return [];
  }

  private async getAllChurnRisks(): Promise<ChurnRisk[]> {
    try {
      const q = query(collection(this.db, 'churn_risks'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ChurnRisk);
    } catch (error) {
      return [];
    }
  }

  private async getAllRetentionInsights(): Promise<RetentionInsight[]> {
    try {
      const q = query(collection(this.db, 'retention_insights'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as RetentionInsight);
    } catch (error) {
      return [];
    }
  }

  private async calculatePredictedRevenue(churnRisks: ChurnRisk[]): Promise<number> {
    // Calcul simplifié du revenu prédit
    const totalUsers = churnRisks.length;
    const atRiskUsers = churnRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length;
    const averageRevenuePerUser = 12; // € par mois

    return (totalUsers - atRiskUsers) * averageRevenuePerUser;
  }

  private async calculateAverageLifetimeValue(): Promise<number> {
    // Calcul de la LTV moyenne (simplifié)
    const retentionRate = 0.8; // 80%
    const grossMargin = 0.7; // 70%
    const averageRevenuePerUser = 12; // € par mois
    const churnRate = 0.2; // 20%

    return (averageRevenuePerUser * grossMargin) / churnRate;
  }

  private async saveAnalyticsResults(churnRisks: ChurnRisk[], insights: RetentionInsight[]): Promise<void> {
    try {
      // Sauvegarder les risques de churn
      const churnBatch = churnRisks.map(risk =>
        setDoc(doc(this.db, 'churn_risks', risk.userId), risk)
      );
      await Promise.all(churnBatch);

      // Sauvegarder les insights
      const insightBatch = insights.map(insight =>
        setDoc(doc(this.db, 'retention_insights', `${insight.userId}_${Date.now()}`), insight)
      );
      await Promise.all(insightBatch);

      logger.info(`✅ Résultats analytics sauvegardés: ${churnRisks.length} risques, ${insights.length} insights`);

    } catch (error) {
      logger.error("❌ Erreur sauvegarde résultats analytics:", error);
    }
  }

  private async triggerAutomatedActions(churnRisks: ChurnRisk[]): Promise<void> {
    try {
      const criticalRisks = churnRisks.filter(r => r.riskLevel === 'critical');

      for (const risk of criticalRisks) {
        // Déclencher des actions automatiques pour les risques critiques
        await this.triggerCriticalRiskActions(risk);
      }

      logger.info(`✅ Actions automatiques déclenchées pour ${criticalRisks.length} risques critiques`);

    } catch (error) {
      logger.error("❌ Erreur déclenchement actions automatiques:", error);
    }
  }

  private async triggerCriticalRiskActions(risk: ChurnRisk): Promise<void> {
    try {
      // 1. Créer une tâche de suivi
      await setDoc(doc(this.db, 'follow_up_tasks', `${risk.userId}_${Date.now()}`), {
        userId: risk.userId,
        taskType: 'critical_risk_followup',
        priority: 'high',
        description: `Suivi utilisateur à risque critique (${Math.round(risk.riskScore)}%)`,
        actionItems: risk.recommendations,
        status: 'pending',
        createdAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      });

      // 2. Logger l'événement
      await setDoc(doc(this.db, 'automated_actions', `${risk.userId}_${Date.now()}`), {
        userId: risk.userId,
        actionType: 'critical_risk_detected',
        riskScore: risk.riskScore,
        riskFactors: risk.riskFactors,
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      logger.error(`❌ Erreur actions automatiques pour ${risk.userId}:`, error);
    }
  }
}

export const predictiveAnalyticsService = PredictiveAnalyticsService.getInstance();
export default predictiveAnalyticsService;
