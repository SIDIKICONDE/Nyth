import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as qLimit,
  runTransaction,
  Timestamp,
} from "@react-native-firebase/firestore";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

export interface UserActivity {
  userId: string;
  type: "app_open" | "user_login";
  timestamp: Timestamp;
  date: string; // Format: YYYY-MM-DD
  deviceInfo?: {
    platform?: string;
    version?: string;
  };
}

export interface DailyStats {
  date: string;
  appOpens: number;
  uniqueUsers: number;
  logins: number;
}

export interface UserStats {
  userId: string;
  totalAppOpens: number;
  totalLogins: number;
  lastActive: Timestamp;
  dailyActivity: {
    [date: string]: {
      appOpens: number;
      logins: number;
    };
  };
}

class UserActivityService {
  private static instance: UserActivityService;
  private readonly COLLECTION_ACTIVITIES = "user_activities";
  private readonly COLLECTION_USER_STATS = "user_stats";
  private readonly COLLECTION_DAILY_STATS = "daily_stats";

  private constructor() {}

  static getInstance(): UserActivityService {
    if (!UserActivityService.instance) {
      UserActivityService.instance = new UserActivityService();
    }
    return UserActivityService.instance;
  }

  /**
   * Enregistre une ouverture d'application
   */
  async trackAppOpen(userId: string, deviceInfo?: any): Promise<void> {
    try {
      const now = Timestamp.now();
      const dateStr = this.getDateString(now.toDate());

      // Enregistrer l'activité
      const activity: UserActivity = {
        userId,
        type: "app_open",
        timestamp: now,
        date: dateStr,
        deviceInfo,
      };

      await addDoc(
        collection(getFirestore(getApp()), this.COLLECTION_ACTIVITIES),
        activity
      );

      // Mettre à jour les stats utilisateur
      await this.updateUserStats(userId, "app_open", dateStr, now);

      // Mettre à jour les stats quotidiennes
      await this.updateDailyStats(dateStr, "app_open", userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enregistre une connexion utilisateur
   */
  async trackUserLogin(userId: string, deviceInfo?: any): Promise<void> {
    try {
      const now = Timestamp.now();
      const dateStr = this.getDateString(now.toDate());

      // Enregistrer l'activité
      const activity: UserActivity = {
        userId,
        type: "user_login",
        timestamp: now,
        date: dateStr,
        deviceInfo,
      };

      await addDoc(
        collection(getFirestore(getApp()), this.COLLECTION_ACTIVITIES),
        activity
      );

      // Mettre à jour les stats utilisateur
      await this.updateUserStats(userId, "user_login", dateStr, now);

      // Mettre à jour les stats quotidiennes
      await this.updateDailyStats(dateStr, "user_login", userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour les statistiques utilisateur
   */
  private async updateUserStats(
    userId: string,
    type: "app_open" | "user_login",
    dateStr: string,
    timestamp: Timestamp
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const userStatsRef = doc(
        collection(db, this.COLLECTION_USER_STATS),
        userId
      );

      await runTransaction(db, async (transaction) => {
        const userStatsDoc = await transaction.get(userStatsRef);

        let stats: UserStats;
        if (userStatsDoc.exists()) {
          stats = userStatsDoc.data() as UserStats;
        } else {
          stats = {
            userId,
            totalAppOpens: 0,
            totalLogins: 0,
            lastActive: timestamp,
            dailyActivity: {},
          };
        }

        // Initialiser l'activité quotidienne si nécessaire
        if (!stats.dailyActivity[dateStr]) {
          stats.dailyActivity[dateStr] = { appOpens: 0, logins: 0 };
        }

        // Mettre à jour les compteurs
        if (type === "app_open") {
          stats.totalAppOpens += 1;
          stats.dailyActivity[dateStr].appOpens += 1;
        } else if (type === "user_login") {
          stats.totalLogins += 1;
          stats.dailyActivity[dateStr].logins += 1;
        }

        stats.lastActive = timestamp;

        transaction.set(userStatsRef, stats);
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour les statistiques quotidiennes
   */
  private async updateDailyStats(
    dateStr: string,
    type: "app_open" | "user_login",
    userId: string
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const dailyStatsRef = doc(
        collection(db, this.COLLECTION_DAILY_STATS),
        dateStr
      );

      await runTransaction(db, async (transaction) => {
        const dailyStatsDoc = await transaction.get(dailyStatsRef);

        let stats: DailyStats;
        if (dailyStatsDoc.exists()) {
          stats = dailyStatsDoc.data() as DailyStats;
        } else {
          stats = {
            date: dateStr,
            appOpens: 0,
            uniqueUsers: 0,
            logins: 0,
          };
        }

        // Mettre à jour les compteurs
        if (type === "app_open") {
          stats.appOpens += 1;
        } else if (type === "user_login") {
          stats.logins += 1;
        }

        // Calculer le nombre d'utilisateurs uniques pour cette date
        // (ceci est fait de manière simple, une approche plus sophistiquée
        // pourrait utiliser une structure de données séparée pour éviter
        // des requêtes coûteuses)
        const activitiesSnapshot = await getDocs(
          query(
            collection(db, this.COLLECTION_ACTIVITIES),
            where("date", "==", dateStr)
          )
        );

        const uniqueUserIds = new Set<string>();
        activitiesSnapshot.docs.forEach(
          (
            doc: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
          ) => {
            const activity = doc.data() as UserActivity;
            uniqueUserIds.add(activity.userId);
          }
        );

        stats.uniqueUsers = uniqueUserIds.size;

        transaction.set(dailyStatsRef, stats);
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer les statistiques utilisateur
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const db = getFirestore(getApp());
      const userStatsRef = doc(
        collection(db, this.COLLECTION_USER_STATS),
        userId
      );
      const userStatsDoc = await getDoc(userStatsRef);

      if (userStatsDoc.exists()) {
        return userStatsDoc.data() as UserStats;
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer les activités d'un utilisateur
   */
  async getUserActivities(
    userId: string,
    limit: number = 50
  ): Promise<UserActivity[]> {
    try {
      const db = getFirestore(getApp());
      const activitiesSnapshot = await getDocs(
        query(
          collection(db, this.COLLECTION_ACTIVITIES),
          where("userId", "==", userId),
          orderBy("timestamp", "desc"),
          qLimit(limit)
        )
      );

      return activitiesSnapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          doc.data() as UserActivity
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer les statistiques quotidiennes
   */
  async getDailyStats(
    startDate: string,
    endDate: string
  ): Promise<DailyStats[]> {
    try {
      const db = getFirestore(getApp());
      const dailyStatsSnapshot = await getDocs(
        query(
          collection(db, this.COLLECTION_DAILY_STATS),
          where("date", ">=", startDate),
          where("date", "<=", endDate),
          orderBy("date")
        )
      );

      return dailyStatsSnapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          doc.data() as DailyStats
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Utilitaire pour formater une date en string
   */
  private getDateString(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}

export const userActivityService = UserActivityService.getInstance();
