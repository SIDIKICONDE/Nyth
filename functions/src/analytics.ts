import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { assertSuperAdmin, serverLogAdminAccess } from "./utils/adminAuth";

// Assurez-vous que l'application admin est initialisée
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Définition des types pour la clarté
interface Script {
  id: string;
  userId: string;
  createdAt: string | admin.firestore.Timestamp;
  // autres champs de script...
}

interface Recording {
  id: string;
  userId: string;
  createdAt: string | admin.firestore.Timestamp;
  duration?: number;
  // autres champs de recording...
}

interface UserAnalytics {
  userId: string;
  avgRecordingTime: number;
  totalRecordingTime: number;
  totalRecordings: number;
  totalScripts: number;
  productivity: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: any;
  weeklyStats: {
    thisWeekTotal: number;
    lastWeekTotal: number;
    weekTrend: number;
    dailyActivity: { [date: string]: any };
  };
  monthlyStats: { [month: string]: any };
  hourlyDistribution: { [hour: number]: number };
  createdAt: any;
  updatedAt: any;
  lifetimeStats?: {
    totalScriptsCreated: number;
    totalRecordingsCreated: number;
    totalRecordingTime: number;
    firstActivityDate: any;
  };
}

interface DailyActivity {
  date: string;
  scripts: number;
  recordings: number;
  totalTime: number;
}

/**
 * Cloud Function pour recalculer les analytics d'un utilisateur.
 * Cette fonction est sécurisée et s'exécute avec des privilèges d'administrateur.
 */
export const recalculateAnalytics = functions.https.onCall(
  async (request: functions.https.CallableRequest<{ userId: string }>) => {
    const { userId } = request.data;

    // Vérifier l'authentification
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "La fonction doit être appelée par un utilisateur authentifié."
      );
    }

    // Exiger Super Admin pour recalculer sur n'importe quel utilisateur
    await assertSuperAdmin(request.auth.uid);

    try {
      await serverLogAdminAccess(
        request.auth.uid,
        "recalculateAnalytics",
        true,
        { userId }
      );
      // Récupérer tous les scripts et enregistrements de l'utilisateur
      const scriptsSnapshot = await db
        .collection("scripts")
        .where("userId", "==", userId)
        .get();
      const recordingsSnapshot = await db
        .collection("recordings")
        .where("userId", "==", userId)
        .get();

      const scripts = scriptsSnapshot.docs.map(
        (doc: admin.firestore.QueryDocumentSnapshot) =>
          ({ id: doc.id, ...doc.data() } as Script)
      );
      const recordings = recordingsSnapshot.docs.map(
        (doc: admin.firestore.QueryDocumentSnapshot) =>
          ({ id: doc.id, ...doc.data() } as Recording)
      );

      // Logique de recalcul (copiée et adaptée de analyticsService.ts)
      const analyticsRef = db.collection("userAnalytics").doc(userId);
      let analytics: UserAnalytics;

      const analyticsDoc = await analyticsRef.get();
      if (!analyticsDoc.exists) {
        // Initialiser si n'existe pas
        analytics = {
          userId,
          avgRecordingTime: 0,
          totalRecordingTime: 0,
          totalRecordings: 0,
          totalScripts: 0,
          productivity: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: admin.firestore.FieldValue.serverTimestamp(),
          weeklyStats: {
            thisWeekTotal: 0,
            lastWeekTotal: 0,
            weekTrend: 0,
            dailyActivity: {},
          },
          monthlyStats: {},
          hourlyDistribution: {},
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
      } else {
        analytics = analyticsDoc.data() as UserAnalytics;
      }

      analytics.totalScripts = scripts.length;
      analytics.totalRecordings = recordings.length;
      analytics.totalRecordingTime = recordings.reduce(
        (sum: number, r: Recording) => sum + (r.duration || 0),
        0
      );
      analytics.avgRecordingTime =
        analytics.totalRecordings > 0
          ? Math.round(analytics.totalRecordingTime / analytics.totalRecordings)
          : 0;
      analytics.productivity =
        analytics.totalScripts > 0
          ? Math.round(
              (analytics.totalRecordings / analytics.totalScripts) * 10
            ) / 10
          : 0;

      const hourlyDist: { [hour: number]: number } = {};
      const dailyActivity: { [date: string]: DailyActivity } = {};
      const monthlyStats: { [month: string]: any } = {};

      const processItem = (item: Script | Recording, isScript: boolean) => {
        const createdAt = item.createdAt;
        if (!createdAt) return;

        // Gérer les timestamps Firestore et les strings ISO
        const date = (createdAt as admin.firestore.Timestamp).toDate
          ? (createdAt as admin.firestore.Timestamp).toDate()
          : new Date(createdAt as string);

        const dateStr = date.toISOString().split("T")[0];
        const hour = date.getHours();
        const month = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        hourlyDist[hour] = (hourlyDist[hour] || 0) + 1;

        if (!dailyActivity[dateStr]) {
          dailyActivity[dateStr] = {
            date: dateStr,
            scripts: 0,
            recordings: 0,
            totalTime: 0,
          };
        }
        if (!monthlyStats[month]) {
          monthlyStats[month] = { scripts: 0, recordings: 0, totalTime: 0 };
        }

        if (isScript) {
          dailyActivity[dateStr].scripts++;
          monthlyStats[month].scripts++;
        } else {
          const duration = (item as Recording).duration || 0;
          dailyActivity[dateStr].recordings++;
          dailyActivity[dateStr].totalTime += duration;
          monthlyStats[month].recordings++;
          monthlyStats[month].totalTime += duration;
        }
      };

      scripts.forEach((script: Script) => processItem(script, true));
      recordings.forEach((recording: Recording) =>
        processItem(recording, false)
      );

      const sortedDates = Object.keys(dailyActivity).sort();
      let longestStreak = 0;
      let tempStreak = 1;
      if (sortedDates.length > 0) {
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i]);
          const prevDate = new Date(sortedDates[i - 1]);
          const diffDays = Math.round(
            (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }

      const today = new Date().toISOString().split("T")[0];
      let currentStreak = 0;
      if (dailyActivity[today]) {
        currentStreak = tempStreak;
      }

      await analyticsRef.set(
        {
          ...analytics,
          hourlyDistribution: hourlyDist,
          monthlyStats,
          weeklyStats: {
            ...analytics.weeklyStats,
            dailyActivity,
          },
          currentStreak,
          longestStreak,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { success: true, message: "Analytics recalculées avec succès." };
    } catch (error) {
      console.error(
        `Erreur lors du recalcul des analytics pour ${userId}:`,
        error
      );
      await serverLogAdminAccess(
        request.auth!.uid,
        "recalculateAnalytics",
        false,
        {
          userId,
          error: (error as Error).message,
        }
      );
      throw new functions.https.HttpsError(
        "internal",
        "Une erreur est survenue lors du recalcul des analytics.",
        error
      );
    }
  }
);
