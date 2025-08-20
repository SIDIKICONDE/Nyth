import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useScripts } from "../contexts/ScriptsContext";
import { useHomeData } from "../components/home/useHomeData";
import analyticsService from "../services/firebase/analyticsService";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook pour migrer automatiquement les utilisateurs existants
 * vers le nouveau système d'analytics cloud
 */
export const useMigrateToCloudAnalytics = () => {
  const { user } = useAuth();
  const { scripts } = useScripts();
  const { recordings } = useHomeData();

  useEffect(() => {
    if (!user?.uid) return;

    const checkAndMigrate = async () => {
      try {
        // Vérifier si la migration a déjà été effectuée
        const migrationKey = `@analytics_migrated_${user.uid}`;
        const isMigrated = await AsyncStorage.getItem(migrationKey);

        if (isMigrated === "true") {
          return;
        }

        // Effectuer la migration
        await analyticsService.recalculateAllAnalytics(
          user.uid,
          scripts,
          recordings
        );

        // Marquer la migration comme effectuée
        await AsyncStorage.setItem(migrationKey, "true");
      } catch (error) {}
    };

    // Attendre un peu pour s'assurer que les données sont chargées
    const timer = setTimeout(checkAndMigrate, 2000);

    return () => clearTimeout(timer);
  }, [user?.uid, scripts.length, recordings.length]);
};

/**
 * Fonction utilitaire pour forcer la recalculation des analytics
 * Utile pour corriger des incohérences ou après une mise à jour majeure
 */
export const forceRecalculateAnalytics = async (
  userId: string,
  scripts: any[],
  recordings: any[]
) => {
  try {
    await analyticsService.recalculateAllAnalytics(userId, scripts, recordings);
  } catch (error) {
    throw error;
  }
};
