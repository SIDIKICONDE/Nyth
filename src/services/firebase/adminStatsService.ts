import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "@react-native-firebase/firestore";

interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalScripts: number;
  totalRecordings: number;
  lastUpdated: any;
}

class AdminStatsService {
  // Récupérer les statistiques globales
  async getGlobalStats(): Promise<AdminStats | null> {
    try {
      const db = getFirestore(getApp());
      const statsDoc = await getDoc(
        doc(collection(db, "adminStats"), "global")
      );
      if (statsDoc.exists()) {
        return statsDoc.data() as AdminStats;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Calculer les statistiques depuis les données utilisateurs
  async calculateStatsFromUsers(users: any[]): Promise<Partial<AdminStats>> {
    let totalScripts = 0;
    let totalRecordings = 0;

    // Compter depuis les stats des utilisateurs
    for (const user of users) {
      if (user.stats?.totalScripts) {
        totalScripts += user.stats.totalScripts;
      }
      if (user.stats?.totalRecordings) {
        totalRecordings += user.stats.totalRecordings;
      }
    }

    // Essayer de compter par requêtes individuelles si les totaux sont à 0
    if (totalScripts === 0) {
      const db = getFirestore(getApp());
      for (const user of users) {
        try {
          const q = query(
            collection(db, "scripts"),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          totalScripts += snapshot.size;
        } catch (err) {}
      }
    }

    if (totalRecordings === 0) {
      for (const user of users) {
        try {
          const q = query(
            collection(getFirestore(getApp()), "recordings"),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          totalRecordings += snapshot.size;
        } catch (err) {}
      }
    }

    return {
      totalScripts,
      totalRecordings,
    };
  }

  // Mettre à jour les statistiques globales (pour une Cloud Function future)
  async updateGlobalStats(stats: Partial<AdminStats>): Promise<boolean> {
    try {
      const db = getFirestore(getApp());
      await setDoc(
        doc(collection(db, "adminStats"), "global"),
        {
          ...stats,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new AdminStatsService();
