import { useState, useEffect } from "react";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { UserProfile, UserRole } from "../../../types/user";
import adminStatsService from "../../../services/firebase/adminStatsService";
import { adminCacheService } from "../../../services/cache/adminCacheService";
import {
  AdminStats,
  ActivityItem,
  SubscriptionItem,
  AdminDataState,
} from "../types";

export const useAdminData = (isAdmin: boolean) => {
  const [state, setState] = useState<AdminDataState>({
    users: [],
    stats: null,
    subscriptions: [],
    recentActivity: [],
    loading: true,
    syncing: false,
  });

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Charger les utilisateurs avec cache
      const usersData = await adminCacheService.getCachedUsers() as UserProfile[];

      // Charger les souscriptions avec cache
      const db = getFirestore(getApp());
      const subscriptionsData = await adminCacheService.getOrFetch(
        "admin_subscriptions",
        async () => {
          const subscriptionsQuery = query(
            collection(db, "subscriptions"),
            orderBy("createdAt", "desc"),
            limit(50)
          );
          const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
          return subscriptionsSnapshot.docs.map(
            (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
              id: doc.id,
              userId: doc.data().userId || "",
              plan: doc.data().plan || "free",
              status: doc.data().status || "inactive",
              endDate: doc.data().endDate || "",
              ...doc.data(),
            })
          );
        },
        15 // 15 minutes TTL
      ) as SubscriptionItem[];

      // Charger l'activité récente avec cache
      const scriptsQuery = query(
        collection(db, "scripts"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const scriptsSnapshot = await getDocs(scriptsQuery);
      const recentScripts: ActivityItem[] = scriptsSnapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: doc.id,
          type: "script" as const,
          ...doc.data(),
        })
      );

      const recordingsQuery = query(
        collection(db, "recordings"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const recordingsSnapshot = await getDocs(recordingsQuery);
      const recentRecordings: ActivityItem[] = recordingsSnapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: doc.id,
          type: "recording" as const,
          ...doc.data(),
        })
      );

      // Combiner et trier par date
      const allActivity = [...recentScripts, ...recentRecordings]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || "");
          const dateB = new Date(b.createdAt || "");
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 30);

      // Calculer les statistiques avec cache
      const stats = await adminCacheService.getOrFetch(
        "admin_stats_calculated",
        () => calculateStats(usersData, subscriptionsData),
        10 // 10 minutes TTL
      ) as AdminStats;

      setState({
        users: usersData,
        stats,
        subscriptions: subscriptionsData,
        recentActivity: allActivity,
        loading: false,
        syncing: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const calculateStats = async (
    usersData: UserProfile[],
    subscriptionsData: SubscriptionItem[]
  ): Promise<AdminStats> => {
    // Récupérer les stats globales
    let totalScripts = 0;
    let totalRecordings = 0;

    const globalStats = await adminStatsService.getGlobalStats();

    if (globalStats && globalStats.lastUpdated) {
      const lastUpdate = globalStats.lastUpdated.toDate
        ? globalStats.lastUpdated.toDate()
        : new Date(globalStats.lastUpdated);
      const hoursSinceUpdate =
        (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < 24) {
        totalScripts = globalStats.totalScripts || 0;
        totalRecordings = globalStats.totalRecordings || 0;
      }
    }

    // Si pas de stats globales, calculer depuis les utilisateurs
    if (totalScripts === 0 && totalRecordings === 0) {
      const calculatedStats = await adminStatsService.calculateStatsFromUsers(
        usersData
      );
      totalScripts = calculatedStats.totalScripts || 0;
      totalRecordings = calculatedStats.totalRecordings || 0;
    }

    // Calculer les autres statistiques
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSubscriptions = subscriptionsData.filter(
      (s) => s.status === "active"
    ).length;
    const premiumUsers = subscriptionsData.filter(
      (s) => s.plan === "premium" && s.status === "active"
    ).length;
    const revenue = subscriptionsData
      .filter((s) => s.status === "active")
      .reduce((total, sub) => {
        const planPrices: any = { basic: 9.99, pro: 19.99, premium: 39.99 };
        return total + (planPrices[sub.plan] || 0);
      }, 0);

    return {
      totalUsers: usersData.length,
      totalAdmins: usersData.filter(
        (u) => u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN
      ).length,
      activeToday: usersData.filter((u) => {
        if (!u.lastLoginAt) return false;

        let lastLoginDate: Date;
        const lastLogin = u.lastLoginAt as any;
        if (typeof lastLogin === "object" && lastLogin.seconds) {
          lastLoginDate = new Date(lastLogin.seconds * 1000);
        } else if (typeof lastLogin === "string") {
          lastLoginDate = new Date(lastLogin);
        } else {
          return false;
        }

        return lastLoginDate >= today;
      }).length,
      totalScripts,
      totalRecordings,
      activeSubscriptions,
      premiumUsers,
      monthlyRevenue: revenue,
    };
  };

  const setSyncing = (syncing: boolean) => {
    setState((prev) => ({ ...prev, syncing }));
  };

  return {
    ...state,
    loadData,
    setSyncing,
  };
};
