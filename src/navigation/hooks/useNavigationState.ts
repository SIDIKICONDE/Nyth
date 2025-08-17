import { useMemo, useRef } from "react";
import { createLogger } from "../../utils/optimizedLogger";
import { useGlobalPreferencesContext } from "../../contexts/GlobalPreferencesContext";

const logger = createLogger("NavigationState");

export interface UseNavigationStateProps {
  currentUser: any;
  authLoading: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasPermissions: boolean;
}

export interface NavigationState {
  canAccessApp: boolean;
  initialRoute: string;
  shouldShowPrivacy: boolean;
  shouldShowOnboarding: boolean;
  shouldShowPermissions: boolean;
}

export const useNavigationState = ({
  currentUser,
  authLoading,
  isLoading,
  isInitialLoading,
  hasCompletedOnboarding,
  hasPermissions,
}: UseNavigationStateProps): NavigationState => {
  const lastStateRef = useRef<string>("");
  const { homePage } = useGlobalPreferencesContext();

  const navigationState = useMemo(() => {
    // Si on est encore en train de charger l'authentification, attendre
    if (authLoading || isInitialLoading) {
      return {
        canAccessApp: false,
        initialRoute: "Login", // Temporaire pendant le chargement
        shouldShowPrivacy: false,
        shouldShowOnboarding: false,
        shouldShowPermissions: false,
      };
    }

    // Vérifier si l'utilisateur est connecté (Firebase ou invité)
    const isAuthenticated = currentUser && !currentUser.isGuest;
    const isGuestUser = currentUser && currentUser.isGuest;

    // Déterminer la route initiale et l'accès à l'app
    let initialRoute: string;
    let canAccessApp: boolean;

    if (isAuthenticated || isGuestUser) {
      // Utilisateur connecté -> choisir la page d'accueil selon la préférence
      switch (homePage) {
        case "planning":
          initialRoute = "Planning";
          break;
        case "ai-chat":
          initialRoute = "AIChat";
          break;
        case "default":
        default:
          initialRoute = "Home";
          break;
      }
      canAccessApp = true;
    } else {
      // Utilisateur non connecté -> aller à Login
      initialRoute = "Login";
      canAccessApp = false; // Bloqué jusqu'à la connexion ou mode invité
    }

    // Calculer les états d'affichage (gardés désactivés pour l'instant)
    const shouldShowPrivacy = false; // Politique de confidentialité supprimée
    const shouldShowOnboarding = false; // Onboarding désactivé
    const shouldShowPermissions = false; // Permissions désactivées

    return {
      canAccessApp,
      initialRoute,
      shouldShowPrivacy,
      shouldShowOnboarding,
      shouldShowPermissions,
    };
  }, [
    currentUser,
    authLoading,
    isLoading,
    isInitialLoading,
    hasCompletedOnboarding,
    hasPermissions,
    currentUser?.emailVerified,
    homePage,
  ]);

  // Log state changes pour le debugging
  const currentStateString = JSON.stringify(navigationState);
  if (lastStateRef.current !== currentStateString) {
    logger.debug("Navigation state changed - AUTHENTIFICATION ACTIVÉE", {
      currentUser: currentUser ? currentUser.email || "Invité" : "Aucun",
      isAuthenticated: !!(currentUser && !currentUser.isGuest),
      isGuest: !!(currentUser && currentUser.isGuest),
      initialRoute: navigationState.initialRoute,
      canAccessApp: navigationState.canAccessApp,
      authLoading,
    });
    lastStateRef.current = currentStateString;
  }

  return navigationState;
};

export default useNavigationState;
