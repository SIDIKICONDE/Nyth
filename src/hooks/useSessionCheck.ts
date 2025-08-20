import { useEffect, useRef } from "react";
import { getAuth } from "@react-native-firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { SESSION_CONFIG, isSessionExpired, getSessionCheckInterval } from "../config/sessionConfig";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("useSessionCheck");

export function useSessionCheck() {
  const { user, logout } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user || user.isGuest) return;

    // Mettre à jour la dernière activité
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      warningShownRef.current = false;
    };

    // Vérifier la session avec logique personnalisée
    const checkSession = async () => {
      try {
        const currentUser = getAuth().currentUser;
        if (!currentUser) {
          logger.warn("🔐 Aucun utilisateur Firebase trouvé lors de la vérification");
          return;
        }

        const timeSinceActivity = Date.now() - lastActivityRef.current;
        const isExpired = isSessionExpired(lastActivityRef.current);

        // Vérifier si la session est expirée
        if (isExpired) {
          logger.info(`⏰ Session expirée après ${SESSION_CONFIG.sessionExpiryDays} jours d'inactivité`);
          await logout();
          return;
        }

        // Avertissement d'inactivité
        const warningTime = SESSION_CONFIG.inactivityWarningMinutes * 60 * 1000;
        if (timeSinceActivity > warningTime && !warningShownRef.current) {
          logger.warn(`⚠️ Avertissement: ${Math.round(timeSinceActivity / 1000 / 60)} minutes d'inactivité`);
          warningShownRef.current = true;

          // Ici vous pourriez afficher une notification à l'utilisateur
          // Par exemple: showInactivityWarning();
        }

        // Renouveler le token pour maintenir la session active
        if (SESSION_CONFIG.autoExtendSession) {
          await currentUser.getIdToken(true);
          updateActivity(); // Reset de l'activité après refresh réussi
          logger.debug("🔄 Token renouvelé avec succès");
        }

      } catch (error) {
        logger.error("❌ Erreur lors de la vérification de session:", error);

        // En cas d'erreur réseau, ne pas déconnecter immédiatement
        // mais logger l'erreur pour le monitoring
        if (error instanceof Error && error.message.includes('network')) {
          logger.warn("🌐 Erreur réseau lors du refresh token - session maintenue");
          return;
        }
      }
    };

    // Vérifier immédiatement au montage
    updateActivity();
    checkSession();

    // Écouter les événements d'activité utilisateur
    const activityEvents = ['touchstart', 'touchmove', 'scroll', 'click'];
    const activityHandler = () => updateActivity();

    activityEvents.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });

    // Vérifier la session à intervalle régulier
    const interval = setInterval(checkSession, getSessionCheckInterval());

    // Cleanup
    return () => {
      clearInterval(interval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, activityHandler);
      });
    };
  }, [user, logout]);
}
