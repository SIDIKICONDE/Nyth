import React, { useEffect, useRef, useState } from "react";
import { AuthContext } from "./context";
import { AuthProviderProps, User } from "./types";
import { createOptimizedLogger } from '../../utils/optimizedLogger';
import { createAuthActions } from "./actions";
import { createAuthInit } from "./init";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseReady, setFirebaseReady] = useState(false);
  const [isGoogleSignInConfigured, setGoogleSignInConfigured] = useState(false);
  const [_isOfflineMode, setIsOfflineMode] = useState(false);

  // Références pour éviter les fuites mémoire et optimiser les re-renders
  const isMountedRef = useRef(true);
  const authStateListenerRef = useRef<(() => void) | null>(null);
  const lastUserStateRef = useRef<string>("");

  const logger = createOptimizedLogger('AuthProvider');

  // Crée les actions d'authentification (signIn, signUp, etc.)
  const actions = createAuthActions({
    user,
    setUser,
    setLoading,
    setError,
    isGoogleSignInConfigured,
    isMountedRef,
    lastUserStateRef,
    logger,
  });

  // Crée les fonctions d'initialisation (initializeAuth, listener, refresh)
  const init = createAuthInit({
    setUser,
    setLoading,
    setFirebaseReady,
    setGoogleSignInConfigured,
    setIsOfflineMode,
    isMountedRef,
    authStateListenerRef,
    lastUserStateRef,
    signInAsGuest: actions.signInAsGuest,
    logger,
  });

  // Initialisation lors du montage
  useEffect(() => {
    isMountedRef.current = true;

    const initialize = async () => {
      // Configuration pour EAS Build (version native)
      logger.debug("🚀 Configuration pour EAS Build (version native)");

      await init.initializeAuth();
    };

    initialize();

    // Nettoyage lors du démontage
    return () => {
      isMountedRef.current = false;
      init.cleanup();
    };
  }, []);

  // Mettre en place l'écouteur seulement si Firebase est prêt
  useEffect(() => {
    if (isFirebaseReady) {
      logger.debug("🔥 Firebase est prêt, configuration de l'écouteur d'état.");
      init.setupAuthStateListener();
    }
  }, [isFirebaseReady]);

  const value = {
    user,
    currentUser: user,
    loading,
    isLoading: loading,
    error,
    // Actions
    signIn: actions.signIn,
    signUp: actions.signUp,
    signInAsGuest: actions.signInAsGuest,
    signInWithGoogle: actions.handleGoogleSignIn,
    signInWithApple: actions.handleAppleSignIn,
    logout: actions.logout,
    updateUserProfile: actions.updateUserProfile,
    resetPassword: actions.resetPassword,
    changeEmail: actions.changeEmail,
    changePassword: actions.changePassword,
    deleteAccount: actions.deleteAccount,

    // Utils
    refreshAuthState: init.refreshAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
