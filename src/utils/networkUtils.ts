/**
 * Utilitaires pour la gestion du réseau et la détection de la connexion Internet
 */
import NetInfo from "@react-native-community/netinfo";
import { createLogger } from "./optimizedLogger";

const logger = createLogger("NetworkUtils");

/**
 * Vérifie si l'appareil a une connexion Internet active
 * @returns {Promise<boolean>} True si l'appareil est connecté à Internet, sinon False
 */
export const hasInternetConnection = async (): Promise<boolean> => {
  try {
    // Utiliser NetInfo pour une détection plus fiable
    const netInfoState = await NetInfo.fetch();

    // Si NetInfo indique clairement qu'il n'y a pas de connexion, retourner false
    if (netInfoState.isConnected === false) {
      logger.info("Pas de connexion réseau détectée par NetInfo");
      return false;
    }

    // Si NetInfo indique une connexion, faire confiance en priorité à cette information
    if (netInfoState.isConnected === true) {
      // Si isInternetReachable est explicitement false, faire un test rapide
      if (netInfoState.isInternetReachable === false) {
        logger.info("NetInfo indique pas d'accès Internet, test rapide...");

        // Test rapide avec un seul endpoint fiable et timeout court
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes seulement

        try {
          const response = await fetch("https://dns.google/dns-query", {
            method: "HEAD",
            signal: controller.signal,
            cache: "no-cache",
          });
          clearTimeout(timeoutId);
          return response.ok;
        } catch (error) {
          clearTimeout(timeoutId);
          logger.warn(
            "Test rapide de connexion échoué, mais NetInfo indique connecté - assumons connecté"
          );
          // Si le test échoue mais NetInfo dit qu'on est connecté, on fait confiance à NetInfo
          return true;
        }
      }

      // Si isInternetReachable n'est pas explicitement false, faire confiance à NetInfo
      logger.info("NetInfo indique connexion active");
      return true;
    }

    // Si NetInfo ne peut pas déterminer l'état, supposer connecté par défaut
    logger.info("État de connexion indéterminé par NetInfo, assumons connecté");
    return true;
  } catch (error) {
    logger.error("Erreur lors de la vérification de connexion:", error);
    // En cas d'erreur, supposer connecté pour éviter de bloquer l'utilisateur
    return true;
  }
};

/**
 * Retourne le statut détaillé de la connexion
 * @returns {Promise<{isConnected: boolean, isFastConnection: boolean, type: string, lastChecked: Date}>}
 */
export const getConnectionStatus = async (): Promise<{
  isConnected: boolean;
  isFastConnection: boolean;
  type: string;
  lastChecked: Date;
}> => {
  try {
    const netInfoState = await NetInfo.fetch();
    const startTime = Date.now();
    const isConnected = await hasInternetConnection();
    const endTime = Date.now();

    // Mesurer le temps de réponse pour estimer la vitesse de connexion
    const responseTime = endTime - startTime;
    const isFastConnection =
      responseTime < 1000 && netInfoState.type !== "cellular"; // Considérer rapide si < 1s et pas en données mobiles

    return {
      isConnected,
      isFastConnection,
      type: netInfoState.type || "unknown",
      lastChecked: new Date(),
    };
  } catch (error) {
    logger.error(
      "Erreur lors de la récupération du statut de connexion:",
      error
    );
    return {
      isConnected: false,
      isFastConnection: false,
      type: "unknown",
      lastChecked: new Date(),
    };
  }
};

/**
 * Écouter les changements de connexion réseau
 * @param callback Fonction appelée lors des changements de connexion
 * @returns Fonction pour se désabonner
 */
export const subscribeToNetworkChanges = (
  callback: (isConnected: boolean) => void
): (() => void) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    callback(state.isConnected === true && state.isInternetReachable !== false);
  });

  return unsubscribe;
};
