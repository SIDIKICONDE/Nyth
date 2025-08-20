import React from "react";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { initializeFirebase, setupFirebaseServices } from "../../config/firebase";
import { offlineManager } from "../../services/OfflineManager";
import { User } from "./types";
import { getSavedUser, saveUser, setFirebaseSession, clearAuthStorage } from "./storage";
import { notifyStateChange, isMounted, cleanupRef } from "./utils";
import { configureGoogleSignIn as configureGoogleSignInSocial } from "./socialAuth";
import { createOptimizedLogger } from '../../utils/optimizedLogger';

export type AuthInitDeps = {
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setLoading: (value: boolean) => void;
  setFirebaseReady: (value: boolean) => void;
  setGoogleSignInConfigured: (value: boolean) => void;
  setIsOfflineMode: (value: boolean) => void;
  isMountedRef: React.MutableRefObject<boolean>;
  authStateListenerRef: React.MutableRefObject<(() => void) | null>;
  lastUserStateRef: React.MutableRefObject<string>;
  signInAsGuest: () => Promise<boolean>;
  logger?: {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
};

export function createAuthInit(deps: AuthInitDeps) {
  const {
    setUser,
    setLoading,
    setFirebaseReady,
    setGoogleSignInConfigured,
    setIsOfflineMode,
    isMountedRef,
    authStateListenerRef,
    lastUserStateRef,
    signInAsGuest,
    logger = createOptimizedLogger('AuthInit'),
  } = deps;

  const refreshAuthState = async () => {
    try {
      logger.debug("🔄 Rafraîchissement forcé de l'état d'authentification...");

      const currentAuthUser = getAuth().currentUser;
      if (currentAuthUser) {
        logger.debug("🔥 Utilisateur Firebase détecté lors du rafraîchissement:", currentAuthUser.uid);

        const userData: User = {
          uid: currentAuthUser.uid,
          email: currentAuthUser.email,
          name: currentAuthUser.displayName,
          displayName: currentAuthUser.displayName,
          photoURL: currentAuthUser.photoURL,
          emailVerified: currentAuthUser.emailVerified,
          isGuest: false,
        };

        if (isMounted(isMountedRef)) {
          setUser(userData);
          setLoading(false);
        }
        return;
      }

      logger.debug("❌ Aucun utilisateur trouvé lors du rafraîchissement");
      if (isMounted(isMountedRef)) {
        setUser(null);
        setLoading(false);
      }
    } catch (err) {
      logger.error("❌ Erreur lors du rafraîchissement de l'état d'auth:", err);
      if (isMounted(isMountedRef)) {
        setLoading(false);
      }
    }
  };

  const initializeAuth = async () => {
    try {
      logger.debug("🚀 Initialisation de l'authentification...");

      const isOnline = offlineManager.getIsOnline();
      if (!isOnline) {
        logger.warn("📵 Mode hors ligne détecté au démarrage");
        setIsOfflineMode(true);

        const cachedOfflineUser = await offlineManager.getOfflineData('user');
        const savedUserLocal = await getSavedUser();
        const offlineUser = (cachedOfflineUser as User | null) || savedUserLocal;

        if (offlineUser) {
          logger.info("👤 Utilisateur hors ligne restauré (cache local)");
          setUser(offlineUser);
        } else {
          logger.warn("👥 Aucun utilisateur local trouvé, activation du mode invité hors ligne");
          await signInAsGuest();
        }

        await offlineManager.loadPendingOperations();

        setLoading(false);
        return;
      }

      const firebaseOk = await initializeFirebase();
      if (firebaseOk) {
        setupFirebaseServices();
        setFirebaseReady(true);
        logger.debug("✅ Firebase est prêt.");
      } else {
        logger.warn("⚠️ L'initialisation de Firebase a échoué.");
        setFirebaseReady(false);
        setIsOfflineMode(true);

        const cachedOfflineUser = await offlineManager.getOfflineData('user');
        const savedUserLocal = await getSavedUser();
        const offlineUser = (cachedOfflineUser as User | null) || savedUserLocal;
        if (offlineUser) {
          setUser(offlineUser);
        } else {
          logger.warn("👥 Aucun utilisateur local trouvé, activation du mode invité hors ligne (fallback Firebase)");
          await signInAsGuest();
        }

        setLoading(false);
        return;
      }

      const googleConfigured = configureGoogleSignInSocial();
      setGoogleSignInConfigured(googleConfigured);
      if (googleConfigured) {
        logger.debug("✅ Google Sign-In configuré");
      } else {
        logger.warn("⚠️ Impossible de configurer Google Sign-In");
      }

      try {
        const currentAuthUser = getAuth().currentUser;
        if (currentAuthUser) {
          logger.debug("🔥 Utilisateur Firebase déjà connecté:", currentAuthUser.uid);
          try {
            await currentAuthUser.getIdToken(true);
            logger.debug("✅ Token Firebase valide");
          } catch (tokenError) {
            logger.error("❌ Token invalide, déconnexion nécessaire:", tokenError);
            await getAuth().signOut();
          }
        }
      } catch (authError) {
        logger.warn("⚠️ Erreur lors de la vérification de l'authentification:", authError);
      }
    } catch (err) {
      logger.error("Erreur initialisation auth:", err);
      setLoading(false);
    }
  };

  const setupAuthStateListener = async () => {
    try {
      logger.debug("🔥 Configuration de l'écouteur d'état d'authentification.");

      const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
        if (!isMounted(isMountedRef)) return;

        if (firebaseUser) {
          logger.debug("👤 Utilisateur Firebase connecté:", firebaseUser.uid);

          const localUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Utilisateur",
            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Utilisateur",
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isGuest: false,
          };

          setUser(localUser);
          await saveUser(localUser);
          try {
            await offlineManager.saveOfflineData('user', localUser);
          } catch (e) {
            logger.warn('Impossible de sauvegarder l’utilisateur en cache hors ligne', e);
          }

          await notifyStateChange(localUser, "firebase_signin", lastUserStateRef);

          await setFirebaseSession(true);

          logger.debug("✅ État d'authentification synchronisé");
        } else {
          logger.debug("👤 Utilisateur Firebase déconnecté");

          if (!offlineManager.getIsOnline()) {
            logger.warn("Mode hors ligne actif: tentative de restauration de la session locale.");
            const cachedOfflineUser = await offlineManager.getOfflineData('user');
            const savedUserLocal = await getSavedUser();
            const offlineUser = (cachedOfflineUser as User | null) || savedUserLocal;

            if (offlineUser) {
              setUser(offlineUser);
            } else {
              await signInAsGuest();
            }

            setLoading(false);
            return;
          }

          setUser(null);
          await clearAuthStorage();
          await notifyStateChange(null, "firebase_signout", lastUserStateRef);
          logger.debug("✅ État local nettoyé après déconnexion Firebase");
        }

        if (isMounted(isMountedRef)) {
          setLoading(false);
        }
      });

      authStateListenerRef.current = unsubscribe;
      logger.debug("✅ Écouteur d'état d'authentification configuré");
    } catch (err) {
      logger.error("❌ Erreur lors de la configuration de l'écouteur d'état:", err);
    }
  };

  const cleanup = () => {
    cleanupRef(authStateListenerRef);
  };

  return { refreshAuthState, initializeAuth, setupAuthStateListener, cleanup };
}


