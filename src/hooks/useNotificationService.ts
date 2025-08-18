import { useEffect, useState } from "react";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("useNotificationService");

/**
 * Hook pour initialiser le service de notification étendu
 */
export const useNotificationService = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Import dynamique pour éviter les dépendances circulaires
        const { enhancedNotificationService } = await import("../services/notifications/EnhancedNotificationService");
        
        // Initialiser le service
        await enhancedNotificationService.initialize();
        
        setIsInitialized(true);
        logger.info("✅ Service de notification initialisé avec succès");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erreur inconnue lors de l'initialisation");
        setError(error);
        logger.error("❌ Erreur lors de l'initialisation du service de notification:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
  };
};
