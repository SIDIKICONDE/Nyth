import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAppState } from "./useAppState";
import { useAppResetManager } from "./useAppResetManager";
import { useAppHandlers } from "./useAppHandlers";
import { useNavigationState } from "./useNavigationState";
import { UseAppNavigatorReturn } from "./types";

export const useAppNavigator = (): UseAppNavigatorReturn => {
  const { currentUser, isLoading: authLoading } = useAuth();

  // État de l'application
  const appState = useAppState();

  // Handlers de l'application
  const handlers = useAppHandlers({
    setHasPermissions: appState.setHasPermissions,
    setHasCompletedOnboarding: appState.setHasCompletedOnboarding,
    setIsInitialLoading: appState.setIsInitialLoading,
    hasCompletedOnboarding: appState.hasCompletedOnboarding,
    hasPermissions: appState.hasPermissions,
  });

  // Gestionnaire de redémarrage
  useAppResetManager({
    setAppResetCounter: appState.setAppResetCounter,
    setIsInitialLoading: appState.setIsInitialLoading,
    checkAppStatus: handlers.checkAppStatus,
  });

  // État de navigation calculé
  const navigationState = useNavigationState({
    currentUser,
    authLoading,
    isLoading: appState.isLoading,
    isInitialLoading: appState.isInitialLoading,
    hasCompletedOnboarding: appState.hasCompletedOnboarding,
    hasPermissions: appState.hasPermissions,
  });

  // Effet pour gérer l'utilisateur connecté
  useEffect(() => {
    if (currentUser && !authLoading) {
      handlers.handleUserConnectedSkipOnboarding();
    }
  }, [currentUser, authLoading]);

  return {
    // État
    isLoading: appState.isLoading,
    isInitialLoading: appState.isInitialLoading,
    hasCompletedOnboarding: appState.hasCompletedOnboarding,
    hasPermissions: appState.hasPermissions,
    appResetCounter: appState.appResetCounter,

    // Actions
    setIsLoading: appState.setIsLoading,
    setIsInitialLoading: appState.setIsInitialLoading,
    setHasCompletedOnboarding: appState.setHasCompletedOnboarding,
    setHasPermissions: appState.setHasPermissions,
    setAppResetCounter: appState.setAppResetCounter,

    // Handlers
    ...handlers,

    // État de navigation
    navigationState,
  };
};
