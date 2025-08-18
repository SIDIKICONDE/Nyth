import { useMemo, useRef } from "react";
import { createLogger } from "../../utils/optimizedLogger";
import { useGlobalPreferencesContext } from "../../contexts/GlobalPreferencesContext";
import { RootStackParamList } from "../../types/navigation";

const logger = createLogger("NavigationState");

export interface UseNavigationStateProps {
  currentUser: any;
  authLoading: boolean;
  _isLoading: boolean;
  isInitialLoading: boolean;
  _hasCompletedOnboarding: boolean;
  _hasPermissions: boolean;
}

export interface NavigationState {
  canAccessApp: boolean;
  initialRoute: keyof RootStackParamList;
  shouldShowPrivacy: boolean;
  shouldShowOnboarding: boolean;
  shouldShowPermissions: boolean;
}

export const useNavigationState = ({
  currentUser,
  authLoading,
  _isLoading,
  isInitialLoading,
  _hasCompletedOnboarding,
  _hasPermissions,
}: UseNavigationStateProps): NavigationState => {
  const lastStateRef = useRef<string>("");
  const { homePage } = useGlobalPreferencesContext();

  const navigationState = useMemo<NavigationState>(() => {
    // Si on est encore en train de charger l'authentification, attendre
    if (authLoading || isInitialLoading) {
      return {
        canAccessApp: false,
        initialRoute: "Login" as keyof RootStackParamList,
        shouldShowPrivacy: false,
        shouldShowOnboarding: false,
        shouldShowPermissions: false,
      };
    }

    // Vérifier si l'utilisateur est connecté (Firebase ou invité)
    const isAuthenticated = currentUser && !currentUser.isGuest;
    const isGuestUser = currentUser && currentUser.isGuest;

    // Déterminer la route initiale et l'accès à l'app
    let initialRoute: keyof RootStackParamList;
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
  }, [currentUser, authLoading, isInitialLoading, homePage]);

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
