import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

export interface AdminDashboardData {
  users: {
    total: number;
    active: number;
    new: {
      today: number;
      week: number;
      month: number;
    };
  };
  activity: {
    dau: number;
    wau: number;
    mau: number;
    sessions: number;
    avgSessionDuration: number;
  };
  content: {
    recordings: {
      total: number;
      today: number;
      avgDuration: number;
    };
    scripts: {
      total: number;
      today: number;
    };
    storage: {
      used: number;
      limit: number;
    };
  };
  revenue: {
    total: number;
    monthly: number;
    subscriptions: {
      active: number;
      premium: number;
      trial: number;
    };
    arpu: number;
    conversionRate: number;
  };
  performance: {
    avgLoadTime: number;
    apiResponseTime: number;
    errorRate: number;
    crashRate: number;
    uptime: number;
  };
}

class AdminDataService {
  private static instance: AdminDataService;
  private firestore = getFirestore(getApp());
  private listeners: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): AdminDataService {
    if (!AdminDataService.instance) {
      AdminDataService.instance = new AdminDataService();
    }
    return AdminDataService.instance;
  }

  /**
   * Obtenir toutes les données du dashboard en temps réel
   */
  async getDashboardData(): Promise<AdminDashboardData> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Charger toutes les données en parallèle
    const [
      usersData,
      sessionsData,
      recordingsData,
      scriptsData,
      subscriptionsData,
      performanceData,
    ] = await Promise.all([
      this.getUsersData(today, weekAgo, monthAgo),
      this.getSessionsData(weekAgo, monthAgo),
      this.getContentData(today),
      this.getScriptsData(today),
      this.getSubscriptionsData(),
      this.getPerformanceData(),
    ]);

    // Calculer les métriques dérivées
    const totalUsers = usersData.total;
    const activeSubscriptions = subscriptionsData.active;
    const conversionRate =
      totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
    const arpu = totalUsers > 0 ? subscriptionsData.revenue / totalUsers : 0;

    return {
      users: usersData,
      activity: sessionsData,
      content: {
        recordings: recordingsData,
        scripts: scriptsData,
        storage: await this.getStorageData(),
      },
      revenue: {
        total: subscriptionsData.totalRevenue,
        monthly: subscriptionsData.revenue,
        subscriptions: {
          active: subscriptionsData.active,
          premium: subscriptionsData.premium,
          trial: subscriptionsData.trial,
        },
        arpu,
        conversionRate,
      },
      performance: performanceData,
    };
  }

  /**
   * Obtenir les données utilisateurs
   */
  private async getUsersData(today: Date, weekAgo: Date, monthAgo: Date) {
    const usersSnapshot = await getDocs(collection(this.firestore, "users"));

    let total = 0;
    let active = 0;
    let newToday = 0;
    let newWeek = 0;
    let newMonth = 0;

    usersSnapshot.forEach(
      (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        total++;
        const data = doc.data();
        const createdAt = this.toDate(data.createdAt);
        const lastSeen = this.toDate(data.lastSeen || data.lastLoginAt);

        if (createdAt) {
          if (createdAt >= today) newToday++;
          if (createdAt >= weekAgo) newWeek++;
          if (createdAt >= monthAgo) newMonth++;
        }

        if (lastSeen && lastSeen >= weekAgo) {
          active++;
        }
      }
    );

    return {
      total,
      active,
      new: {
        today: newToday,
        week: newWeek,
        month: newMonth,
      },
    };
  }

  /**
   * Obtenir les données de sessions
   */
  private async getSessionsData(weekAgo: Date, monthAgo: Date) {
    try {
      const sessionsQuery = query(
        collection(this.firestore, "active_sessions"),
        where("lastActivity", ">=", Timestamp.fromDate(monthAgo))
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const uniqueUsersDay = new Set<string>();
      const uniqueUsersWeek = new Set<string>();
      const uniqueUsersMonth = new Set<string>();
      let totalDuration = 0;
      let sessionCount = 0;

      sessionsSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = doc.data();
          const lastActivity = this.toDate(data.lastActivity);
          const userId = data.userId;

          if (lastActivity && userId) {
            if (lastActivity >= dayAgo) uniqueUsersDay.add(userId);
            if (lastActivity >= weekAgo) uniqueUsersWeek.add(userId);
            if (lastActivity >= monthAgo) uniqueUsersMonth.add(userId);
          }

          const startTime = this.toDate(data.startTime);
          if (startTime && lastActivity) {
            const duration = lastActivity.getTime() - startTime.getTime();
            if (duration > 0) {
              totalDuration += duration;
              sessionCount++;
            }
          }
        }
      );

      const avgSessionDuration =
        sessionCount > 0 ? totalDuration / sessionCount / 1000 / 60 : 0;

      return {
        dau: uniqueUsersDay.size,
        wau: uniqueUsersWeek.size,
        mau: uniqueUsersMonth.size,
        sessions: sessionCount,
        avgSessionDuration,
      };
    } catch (error) {
      console.error("Erreur lors du chargement des sessions:", error);
      return {
        dau: 0,
        wau: 0,
        mau: 0,
        sessions: 0,
        avgSessionDuration: 0,
      };
    }
  }

  /**
   * Obtenir les données de contenu (enregistrements)
   */
  private async getContentData(today: Date) {
    try {
      const recordingsSnapshot = await getDocs(
        collection(this.firestore, "recordings")
      );

      let total = 0;
      let todayCount = 0;
      let totalDuration = 0;

      recordingsSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          total++;
          const data = doc.data();
          const createdAt = this.toDate(data.createdAt);

          if (createdAt && createdAt >= today) {
            todayCount++;
          }

          if (data.duration) {
            totalDuration += Number(data.duration);
          }
        }
      );

      const avgDuration = total > 0 ? totalDuration / total / 60 : 0;

      return {
        total,
        today: todayCount,
        avgDuration,
      };
    } catch (error) {
      console.error("Erreur lors du chargement des enregistrements:", error);
      return {
        total: 0,
        today: 0,
        avgDuration: 0,
      };
    }
  }

  /**
   * Obtenir les données de scripts
   */
  private async getScriptsData(today: Date) {
    try {
      const scriptsSnapshot = await getDocs(
        collection(this.firestore, "scripts")
      );

      let total = 0;
      let todayCount = 0;

      scriptsSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          total++;
          const data = doc.data();
          const createdAt = this.toDate(data.createdAt);

          if (createdAt && createdAt >= today) {
            todayCount++;
          }
        }
      );

      return {
        total,
        today: todayCount,
      };
    } catch (error) {
      console.error("Erreur lors du chargement des scripts:", error);
      return {
        total: 0,
        today: 0,
      };
    }
  }

  /**
   * Obtenir les données d'abonnements
   */
  private async getSubscriptionsData() {
    try {
      const subscriptionsSnapshot = await getDocs(
        collection(this.firestore, "user_subscriptions")
      );

      let active = 0;
      let premium = 0;
      let trial = 0;
      let revenue = 0;
      let totalRevenue = 0;

      const prices: Record<string, number> = {
        starter: 4.99,
        basic: 9.99,
        pro: 19.99,
        premium: 39.99,
        enterprise: 49.99,
      };

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      subscriptionsSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = doc.data();

          if (data.status === "active") {
            active++;

            if (data.plan === "premium" || data.planId === "premium") {
              premium++;
            }

            if (data.isTrial) {
              trial++;
            }

            const amount = prices[data.plan || data.planId] || 0;
            totalRevenue += amount;

            const startDate = this.toDate(data.startDate);
            if (startDate && startDate >= startOfMonth) {
              revenue += amount;
            }
          }
        }
      );

      return {
        active,
        premium,
        trial,
        revenue,
        totalRevenue,
      };
    } catch (error) {
      console.error("Erreur lors du chargement des abonnements:", error);
      return {
        active: 0,
        premium: 0,
        trial: 0,
        revenue: 0,
        totalRevenue: 0,
      };
    }
  }

  /**
   * Obtenir les données de stockage
   */
  private async getStorageData() {
    try {
      const recordingsSnapshot = await getDocs(
        collection(this.firestore, "recordings")
      );

      let totalSize = 0;
      recordingsSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = doc.data();
          if (data.fileSize) {
            totalSize += Number(data.fileSize);
          }
        }
      );

      const usedGB = totalSize / (1024 * 1024 * 1024);
      const limitGB = 100; // Limite par défaut

      return {
        used: usedGB,
        limit: limitGB,
      };
    } catch (error) {
      console.error("Erreur lors du chargement du stockage:", error);
      return {
        used: 0,
        limit: 100,
      };
    }
  }

  /**
   * Obtenir les données de performance
   */
  private async getPerformanceData() {
    try {
      const performanceQuery = query(
        collection(this.firestore, "performance_metrics"),
        orderBy("timestamp", "desc"),
        limit(100)
      );
      const performanceSnapshot = await getDocs(performanceQuery);

      let totalLoadTime = 0;
      let loadTimeCount = 0;
      let totalApiTime = 0;
      let apiTimeCount = 0;
      let errorCount = 0;
      let crashCount = 0;

      performanceSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = doc.data();

          if (data.metric === "page_load" && data.duration) {
            totalLoadTime += Number(data.duration);
            loadTimeCount++;
          }

          if (data.metric === "api_call" && data.duration) {
            totalApiTime += Number(data.duration);
            apiTimeCount++;
          }

          if (data.metric === "error") {
            errorCount++;
          }

          if (data.metric === "crash") {
            crashCount++;
          }
        }
      );

      const avgLoadTime = loadTimeCount > 0 ? totalLoadTime / loadTimeCount : 0;
      const apiResponseTime =
        apiTimeCount > 0 ? totalApiTime / apiTimeCount : 0;
      const totalMetrics = performanceSnapshot.size || 1;
      const crashRate = (crashCount / totalMetrics) * 100;
      const errorRate = (errorCount / totalMetrics) * 100;
      const uptime = 100 - crashRate; // Estimation simple

      return {
        avgLoadTime,
        apiResponseTime,
        errorRate,
        crashRate,
        uptime,
      };
    } catch (error) {
      console.error("Erreur lors du chargement des performances:", error);
      return {
        avgLoadTime: 0,
        apiResponseTime: 0,
        errorRate: 0,
        crashRate: 0,
        uptime: 99.9,
      };
    }
  }

  /**
   * Écouter les changements en temps réel
   */
  subscribeToRealTimeUpdates(
    collectionName: string,
    callback: (
      data: FirebaseFirestoreTypes.QuerySnapshot<FirebaseFirestoreTypes.DocumentData>
    ) => void
  ): string {
    const listenerId = `${collectionName}_${Date.now()}`;
    const unsubscribe = onSnapshot(
      query(
        collection(this.firestore, collectionName),
        orderBy("createdAt", "desc"),
        limit(50)
      ),
      callback,
      (error) => {
        console.error(`Erreur lors de l'écoute de ${collectionName}:`, error);
      }
    );

    this.listeners.set(listenerId, unsubscribe);
    return listenerId;
  }

  /**
   * Arrêter l'écoute
   */
  unsubscribe(listenerId: string) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Arrêter toutes les écoutes
   */
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }

  /**
   * Convertir une valeur en Date
   */
  private toDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === "object" && value.toDate) {
      return value.toDate();
    }

    if (typeof value === "object" && value.seconds) {
      return new Date(value.seconds * 1000);
    }

    if (typeof value === "string") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }
}

export const adminDataService = AdminDataService.getInstance();
