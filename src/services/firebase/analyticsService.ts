import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
} from "@react-native-firebase/firestore";
import { UserAnalytics, AnalyticsUpdate } from "../../types/analytics";
import { getAuth } from "@react-native-firebase/auth";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("AnalyticsService");

class AnalyticsService {
  /**
   * Vérifie que l'utilisateur Firebase courant correspond à l'UID fourni
   */
  private isAuthenticatedFor(userId: string): boolean {
    const currentUid = getAuth().currentUser?.uid ?? null;
    return currentUid !== null && currentUid === userId;
  }

  /**
   * Initialiser les analytics pour un utilisateur
   */
  async initializeUserAnalytics(userId: string): Promise<void> {
    try {
      if (!this.isAuthenticatedFor(userId)) {
        logger.info(
          "ℹ️ Ignoré: utilisateur non authentifié pour l'initialisation des analytics",
          { userId }
        );
        return;
      }
      const db = getFirestore(getApp());
      const analyticsRef = doc(collection(db, "userAnalytics"), userId);
      const existing = await getDoc(analyticsRef);

      if (!existing.exists) {
        // Création autorisée si l'utilisateur est propriétaire (cf. règles Firestore)
        await setDoc(analyticsRef, {
          userId,
          avgRecordingTime: 0,
          totalRecordingTime: 0,
          totalRecordings: 0,
          totalScripts: 0,
          productivity: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: new Date().toISOString(),
          weeklyStats: {
            thisWeekTotal: 0,
            lastWeekTotal: 0,
            weekTrend: 0,
            dailyActivity: {},
          },
          monthlyStats: {},
          hourlyDistribution: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lifetimeStats: {
            totalScriptsCreated: 0,
            totalRecordingsCreated: 0,
            totalRecordingTime: 0,
            firstActivityDate: new Date().toISOString(),
          },
        });
        logger.info("✅ Analytics utilisateur initialisés");
      } else {
        // Ne pas toucher à createdAt/userId (interdits par les règles en update)
        await updateDoc(analyticsRef, { updatedAt: serverTimestamp() });
        logger.info("ℹ️ Analytics déjà présents, mise à jour de updatedAt");
      }
    } catch (error) {
      logger.error("❌ Erreur initialisation analytics:", error);
    }
  }

  /**
   * Obtenir les analytics d'un utilisateur
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    try {
      if (!this.isAuthenticatedFor(userId)) {
        logger.info(
          "ℹ️ Lecture analytics ignorée: utilisateur non authentifié",
          { userId }
        );
        return null;
      }
      const db = getFirestore(getApp());
      const analyticsRef = doc(collection(db, "userAnalytics"), userId);
      const snap = await getDoc(analyticsRef);
      return snap.exists() ? (snap.data() as UserAnalytics) : null;
    } catch (error) {
      logger.error("❌ Erreur récupération analytics:", error);
      return null;
    }
  }

  /**
   * Écouter les changements d'analytics
   */
  onAnalyticsChange(
    userId: string,
    callback: (analytics: UserAnalytics | null) => void
  ): () => void {
    if (!this.isAuthenticatedFor(userId)) {
      logger.info(
        "ℹ️ Abonnement analytics ignoré: utilisateur non authentifié",
        { userId }
      );
      // Déclencher un callback neutre pour débloquer les UIs en attente
      setTimeout(() => callback(null), 0);
      return () => {};
    }
    const db = getFirestore(getApp());
    const analyticsRef = doc(collection(db, "userAnalytics"), userId);
    return onSnapshot(analyticsRef, (snap) => {
      callback(snap.exists ? (snap.data() as UserAnalytics) : null);
    });
  }

  /**
   * Mettre à jour les analytics
   */
  async updateAnalytics(
    userId: string,
    updates: AnalyticsUpdate
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const analyticsRef = doc(collection(db, "userAnalytics"), userId);
      await updateDoc(analyticsRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      logger.info("📊 Analytics mises à jour");
    } catch (error) {
      logger.error("❌ Erreur mise à jour analytics:", error);
    }
  }

  /**
   * Mettre à jour les statistiques globales
   */
  async updateGlobalStats(stats: any): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const analyticsRef = doc(collection(db, "adminStats"), "global");
      await setDoc(
        analyticsRef,
        {
          ...stats,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      logger.info("📊 Statistiques globales mises à jour");
    } catch (error) {
      logger.error("❌ Erreur mise à jour stats globales:", error);
    }
  }

  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats(): Promise<any> {
    try {
      const db = getFirestore(getApp());
      const analyticsRef = doc(collection(db, "adminStats"), "global");
      const snap = await getDoc(analyticsRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      logger.error("❌ Erreur récupération stats globales:", error);
      return null;
    }
  }

  /**
   * Écouter les changements de statistiques globales
   */
  onGlobalStatsChange(callback: (stats: any) => void): () => void {
    const db = getFirestore(getApp());
    const analyticsRef = doc(collection(db, "adminStats"), "global");
    return onSnapshot(analyticsRef, (snap) => {
      callback(snap.exists ? snap.data() : null);
    });
  }

  /**
   * S'assurer que les analytics existent (pour compatibilité)
   */
  async ensureAnalyticsExist(userId: string): Promise<void> {
    try {
      if (!this.isAuthenticatedFor(userId)) {
        logger.info(
          "ℹ️ Analytics non créées: utilisateur non authentifié (mode invité?)",
          { userId }
        );
        return;
      }
      await this.initializeUserAnalytics(userId);
    } catch (error) {
      logger.error("❌ Erreur ensuring analytics exist:", error);
    }
  }

  /**
   * Tracker la création d'un script (pour compatibilité)
   */
  async onScriptCreated(userId: string, script: any): Promise<void> {
    try {
      if (!this.isAuthenticatedFor(userId)) {
        logger.info(
          "ℹ️ Ignoré: onScriptCreated sans authentification Firebase",
          { userId }
        );
        return;
      }
      const db = getFirestore(getApp());
      const analyticsRef = doc(collection(db, "userAnalytics"), userId);
      await updateDoc(analyticsRef, {
        totalScripts: increment(1),
        updatedAt: serverTimestamp(),
      });
      logger.info("📊 Script créé tracké");
    } catch (error) {
      logger.error("❌ Erreur tracking script créé:", error);
    }
  }

  /**
   * Tracker la suppression d'un script (pour compatibilité)
   */
  async onScriptDeleted(userId: string, scriptId: string): Promise<void> {
    try {
      if (!this.isAuthenticatedFor(userId)) {
        logger.info(
          "ℹ️ Ignoré: onScriptDeleted sans authentification Firebase",
          { userId }
        );
        return;
      }
      const db = getFirestore(getApp());
      const analyticsRef = doc(collection(db, "userAnalytics"), userId);
      await updateDoc(analyticsRef, {
        totalScripts: increment(-1),
        updatedAt: serverTimestamp(),
      });
      logger.info("📊 Script supprimé tracké");
    } catch (error) {
      logger.error("❌ Erreur tracking script supprimé:", error);
    }
  }

  /**
   * Écouter les changements des analytics (pour compatibilité)
   */
  subscribeToAnalytics(
    userId: string,
    callback: (analytics: UserAnalytics) => void
  ): () => void {
    return this.onAnalyticsChange(userId, (analytics) => {
      if (analytics) {
        callback(analytics);
      }
    });
  }

  /**
   * Recalculer toutes les analytics (pour compatibilité)
   */
  async recalculateAllAnalytics(
    userId: string,
    scripts: any[],
    recordings: any[]
  ): Promise<void> {
    try {
      if (!this.isAuthenticatedFor(userId)) {
        logger.info(
          "ℹ️ Ignoré: recalcul analytics sans authentification Firebase",
          { userId }
        );
        return;
      }
      const db = getFirestore(getApp());
      const analyticsRef = doc(collection(db, "userAnalytics"), userId);
      await updateDoc(analyticsRef, {
        totalScripts: scripts.length,
        totalRecordings: recordings.length,
        updatedAt: serverTimestamp(),
      });
      logger.info("📊 Analytics recalculées");
    } catch (error) {
      logger.error("❌ Erreur recalcul analytics:", error);
    }
  }
}

export default new AnalyticsService();
