import { useCallback } from "react";
import { Alert } from "react-native";

interface UseAnalyticsActionsProps {
  refreshData: () => Promise<void>;
  user: any;
  debugInfo: any;
}

export const useAnalyticsActions = ({
  refreshData,
  user,
}: UseAnalyticsActionsProps) => {
  // Fonction pour forcer le rechargement des données
  const handleRefreshData = useCallback(async () => {
    try {
      await refreshData();
      Alert.alert("✅ Succès", "Données rechargées avec succès");
    } catch (error) {
      Alert.alert("❌ Erreur", "Impossible de recharger les données");
    }
  }, [refreshData]);

  return {
    handleRefreshData,
  };
};
