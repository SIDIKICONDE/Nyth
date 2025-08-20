import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { RootStackParamList } from "../../../types";
import {
  formatCacheSize,
  getCacheSize,
  resetApplicationSettings,
  useCacheTranslation,
} from "../../../utils/cacheManager";
import {
  showClearCacheConfirmation,
  showResetCompleteAlert,
  showResetError,
} from "../utils/alerts";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function useCache() {
  const navigation = useNavigation<NavigationProp>();
  const { resetToDefaultTheme } = useTheme();
  const { t } = useTranslation();
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [cacheSizeFormatted, setCacheSizeFormatted] = useState<string>("");
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Initialiser les traductions pour le cache manager
  useCacheTranslation();

  useEffect(() => {
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    try {
      const size = await getCacheSize();
      setCacheSize(size);
      setCacheSizeFormatted(formatCacheSize(size));
    } catch (error) {
      setCacheSize(0);
      setCacheSizeFormatted(formatCacheSize(0));
    }
  };

  const handleClearCache = () => {
    showClearCacheConfirmation(async () => {
      try {
        setIsClearingCache(true);

        // 1. Réinitialiser le thème au thème par défaut
        await resetToDefaultTheme();

        // 2. Effectuer la réinitialisation des paramètres SEULEMENT (préserve scripts et vidéos)
        await resetApplicationSettings();

        // 3. Réinitialiser les drapeaux d'onboarding
        await AsyncStorage.multiSet([
          ["comeFromReset", "true"],
          ["hasAcceptedPrivacy", "false"],
          ["hasCompletedOnboarding", "false"],
          ["permissionsRequested", "false"],
          ["permissionsStatus", "pending"],
        ]);

        // 4. Recharger la taille du cache après nettoyage
        await loadCacheSize();

        // 5. Forcer un redémarrage complet de l'application
        showResetCompleteAlert(async () => {
          // Recharger la page si on est sur web
          if (Platform.OS === "web") {
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } else {
            // Sur mobile, naviguer vers l'écran de chargement pour simuler un redémarrage
            setTimeout(() => {
              // Réinitialiser la navigation vers l'écran de chargement
              navigation.reset({
                index: 0,
                routes: [{ name: "Loading" as any }],
              });
            }, 100);
          }
        }, t);
      } catch (error) {
        showResetError(t);
        setIsClearingCache(false);
      }
    }, t);
  };

  return {
    cacheSize,
    cacheSizeFormatted,
    isClearingCache,
    loadCacheSize,
    handleClearCache,
  };
}
