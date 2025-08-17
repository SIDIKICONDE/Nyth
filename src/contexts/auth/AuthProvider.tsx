import React, { useEffect, useRef, useState } from "react";
import { getAuth } from "@react-native-firebase/auth";
import {
  initializeFirebase,
  setupFirebaseServices,
} from "../../config/firebase";
import { DefaultApiKeyService } from "../../services/defaultApiKey";
import { migrationService } from "../../services/firebase";
import { AuthContext } from "./context";
import {
  changeUserEmail,
  changeUserPassword,
  createAccount,
  deleteUserAccount,
  sendPasswordReset,
  signInWithEmail,
  signOutFirebase,
  updateUserProfileFirebase,
} from "./firebase";
import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('AuthProvider');

// Utilisation de la version native avec EAS Build
import {
  clearAuthStorage,
  getSavedUser,
  saveUser,
  setFirebaseSession,
} from "./storage";
import { createUserProfile, syncLocalDataToFirebase } from "./syncUtils";
import { AuthProviderProps, User } from "./types";
import {
  cleanupRef,
  delay,
  handleAuthError,
  isMounted,
  notifyStateChange,
} from "./utils";
// Import des connexions sociales (implémentation unifiée)
import {
  configureGoogleSignIn as configureGoogleSignInSocial,
  signInWithApple as signInWithAppleSocial,
  signInWithGoogle as signInWithGoogleSocial,
  signOutGoogle as signOutGoogleSocial,
} from "./socialAuth";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseReady, setFirebaseReady] = useState(false);

  // Références pour éviter les fuites mémoire et optimiser les re-rendus
  const isMountedRef = useRef(true);
  const authStateListenerRef = useRef<(() => void) | null>(null);
  const lastUserStateRef = useRef<string>("");

  /**
   * Force la mise à jour de l'état d'authentification
   */
  const refreshAuthState = async () => {
    try {
      logger.debug("🔄 Rafraîchissement forcé de l'état d'authentification...");

      // Vérifier l'utilisateur Firebase
      const currentAuthUser = getAuth().currentUser;
      if (currentAuthUser) {
        logger.debug(
          "🔥 Utilisateur Firebase détecté lors du rafraîchissement:",
          currentAuthUser.uid
        );

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

      // Aucun utilisateur trouvé
      logger.debug("❌ Aucun utilisateur trouvé lors du rafraîchissement");
      if (isMounted(isMountedRef)) {
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      logger.error(
        "❌ Erreur lors du rafraîchissement de l'état d'auth:",
        error
      );
      if (isMounted(isMountedRef)) {
        setLoading(false);
      }
    }
  };

  /**
   * Initialise l'authentification et configure les écouteurs
   */
  const initializeAuth = async () => {
    try {
      logger.debug("🚀 Initialisation de l'authentification...");

      // Initialiser Firebase et attendre que ce soit prêt
      const firebaseOk = await initializeFirebase();
      if (firebaseOk) {
        setupFirebaseServices(); // Configurer les services après initialisation
        setFirebaseReady(true);
        logger.debug("✅ Firebase est prêt.");
      } else {
        logger.warn("⚠️ L'initialisation de Firebase a échoué.");
        setFirebaseReady(false);
        setLoading(false);
        return;
      }

      // Configurer Google Sign-In
      const googleConfigured = configureGoogleSignInSocial();
      if (googleConfigured) {
        logger.debug("✅ Google Sign-In configuré");
      } else {
        logger.warn("⚠️ Impossible de configurer Google Sign-In");
      }

      // Vérifier l'état actuel de l'authentification
      try {
        const currentAuthUser = getAuth().currentUser;
        if (currentAuthUser) {
          logger.debug(
            "🔥 Utilisateur Firebase déjà connecté:",
            currentAuthUser.uid
          );

          // Forcer le rafraîchissement du token pour s'assurer qu'il est valide
          try {
            await currentAuthUser.getIdToken(true);
            logger.debug("✅ Token Firebase valide");
          } catch (tokenError) {
            logger.error(
              "❌ Token invalide, déconnexion nécessaire:",
              tokenError
            );
            await getAuth().signOut();
          }
        }
      } catch (authError) {
        logger.warn(
          "⚠️ Erreur lors de la vérification de l'authentification:",
          authError
        );
      }
    } catch (err) {
      logger.error("Erreur initialisation auth:", err);
      setLoading(false);
    }
  };

  /**
   * Configure l'écouteur d'état d'authentification Firebase
   */
  const setupAuthStateListener = () => {
    try {
      if (!isFirebaseReady) {
        logger.warn(
          "⚠️ Firebase non prêt, l'écouteur d'authentification ne sera pas configuré."
        );
        setLoading(false);
        return () => {};
      }
      const unsubscribe = getAuth().onAuthStateChanged(async (firebaseUser) => {
        if (!isMounted(isMountedRef)) return;

        logger.debug("🔄 onAuthStateChanged déclenché:", firebaseUser?.uid);

        if (firebaseUser) {
          // Utilisateur Firebase connecté
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isGuest: false,
          };

          logger.debug("🔥 Utilisateur Firebase détecté:", userData);
          setUser(userData);

          // Configurer automatiquement la clé OpenAI par défaut
          DefaultApiKeyService.configureDefaultOpenAIKey()
            .then((configured) => {
              if (configured) {
                logger.debug("✅ Clé OpenAI par défaut configurée avec succès");
              }
            })
            .catch((error) => {
              logger.warn(
                "⚠️ Impossible de configurer la clé OpenAI par défaut:",
                error
              );
            });

          // Sauvegarder localement
          await saveUser(userData);
          await setFirebaseSession(true);

          // Migrer les données existantes vers Firebase (si nécessaire)
          try {
            await migrationService.migrateToFirebase(firebaseUser.uid);
          } catch (err) {
            logger.error("Erreur migration:", err);
          }
        } else {
          // Utilisateur Firebase déconnecté
          logger.debug("❌ Utilisateur Firebase déconnecté");

          // Aucun utilisateur
          setUser(null);
          await notifyStateChange(null, "firebase_signout", lastUserStateRef);
          await clearAuthStorage();
        }

        if (isMounted(isMountedRef)) {
          setLoading(false);
        }
      });

      authStateListenerRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      logger.warn(
        "⚠️ Impossible de configurer l'écouteur d'authentification Firebase:",
        error
      );
      setLoading(false);
      return () => {};
    }
  };

  // Initialisation lors du montage
  useEffect(() => {
    isMountedRef.current = true;

    const initialize = async () => {
      // Configuration pour EAS Build (version native)
      logger.debug("🚀 Configuration pour EAS Build (version native)");

      await initializeAuth();
    };

    initialize();

    // Nettoyage lors du démontage
    return () => {
      isMountedRef.current = false;
      cleanupRef(authStateListenerRef);
    };
  }, []);

  // Mettre en place l'écouteur seulement si Firebase est prêt
  useEffect(() => {
    if (isFirebaseReady) {
      logger.debug("🔥 Firebase est prêt, configuration de l'écouteur d'état.");
      setupAuthStateListener();
    }
  }, [isFirebaseReady]);

  /**
   * Connexion avec email et mot de passe
   */
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithEmail(email, password);

      if (!result.success) {
        setError(result.error || "Erreur lors de la connexion");
        return false;
      }

      // Configurer automatiquement la clé OpenAI par défaut après connexion
      DefaultApiKeyService.configureDefaultOpenAIKey()
        .then((configured) => {
          if (configured) {
            logger.debug("✅ Clé OpenAI par défaut configurée après connexion");
          }
        })
        .catch((error) => {
          logger.warn(
            "⚠️ Impossible de configurer la clé OpenAI après connexion:",
            error
          );
        });

      logger.debug("✅ Connexion réussie");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la connexion");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion en mode invité
   */
  const signInAsGuest = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      // Créer un utilisateur invité avec un UID unique
      const guestId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const guestUser: User = {
        uid: guestId,
        email: null,
        name: "Invité",
        displayName: "Invité",
        photoURL: null,
        emailVerified: false,
        isGuest: true,
      };

      logger.debug("👤 Création utilisateur invité:", guestId);

      // Sauvegarder l'utilisateur invité localement
      setUser(guestUser);
      await saveUser(guestUser);

      // Notifier le changement d'état
      await notifyStateChange(guestUser, "guest_signin", lastUserStateRef);

      logger.debug("✅ Connexion invité réussie");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la connexion invité");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inscription avec email, mot de passe et nom
   */
  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      // Créer le compte Firebase
      const result = await createAccount(email, password, name);

      if (!result.success) {
        setError(result.error || "Erreur lors de l'inscription");
        return false;
      }

      // Créer le profil dans Firestore
      await createUserProfile(result.user.uid, email, name);

      // Synchroniser aussi les données existantes d'un utilisateur déjà connecté
      await syncLocalDataToFirebase(result.user.uid, result.user.uid);

      // Définir l'utilisateur dans l'état local immédiatement
      setUser(result.user);
      await saveUser(result.user);

      // Configurer automatiquement la clé OpenAI par défaut après inscription
      DefaultApiKeyService.configureDefaultOpenAIKey()
        .then((configured) => {
          if (configured) {
            logger.debug(
              "✅ Clé OpenAI par défaut configurée après inscription"
            );
          }
        })
        .catch((error) => {
          logger.warn(
            "⚠️ Impossible de configurer la clé OpenAI après inscription:",
            error
          );
        });

      logger.debug("✅ Compte créé avec succès");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de l'inscription");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      setLoading(true);

      const currentUserData = user;

      logger.debug("📤 Début de la déconnexion:", {
        currentUser: currentUserData?.uid,
        userType: currentUserData?.isGuest ? "Invité" : "Firebase",
      });

      if (currentUserData && !currentUserData.isGuest) {
        logger.debug(
          "🔥 Déconnexion utilisateur Firebase:",
          currentUserData.uid
        );

        // Déconnecter des services sociaux
        try {
          await signOutGoogleSocial();
        } catch (socialError) {
          logger.warn("⚠️ Erreur déconnexion Google:", socialError);
        }

        // Pour un utilisateur Firebase, effacer d'abord les données locales
        await clearAuthStorage(currentUserData.uid);

        // Puis utiliser signOut de Firebase
        const result = await signOutFirebase();
        if (!result.success) {
          setError(result.error || "Erreur lors de la déconnexion");
          return;
        }

        // Mettre à jour l'état immédiatement
        if (isMounted(isMountedRef)) {
          setUser(null);
          await notifyStateChange(null, "firebase_signout", lastUserStateRef);
        }

        logger.debug("✅ Déconnexion Firebase réussie");
      } else {
        // Cas de sécurité : nettoyer tout
        logger.debug("⚠️ État incohérent détecté, nettoyage complet");

        await clearAuthStorage();

        try {
          await signOutFirebase();
          await signOutGoogleSocial();
        } catch (err) {
          logger.warn("Erreur signOut (ignorée):", err);
        }

        if (isMounted(isMountedRef)) {
          setUser(null);
          await notifyStateChange(null, "logout_cleanup", lastUserStateRef);
        }
      }
    } catch (err) {
      handleAuthError(err, setError, "Erreur lors de la déconnexion");

      // En cas d'erreur, forcer un état propre
      if (isMounted(isMountedRef)) {
        setUser(null);
        await notifyStateChange(null, "logout_error", lastUserStateRef);
      }
    } finally {
      if (isMounted(isMountedRef)) {
        setLoading(false);
      }
    }
  };

  /**
   * Met à jour le profil utilisateur
   */
  const updateUserProfile = async (updates: {
    name?: string;
    photoURL?: string;
  }): Promise<boolean> => {
    try {
      setError(null);

      if (!user) {
        setError("Utilisateur non connecté");
        return false;
      }

      const result = await updateUserProfileFirebase(updates);

      if (!result.success) {
        setError(result.error || "Erreur lors de la mise à jour du profil");
        return false;
      }

      // Mettre à jour l'état local
      setUser((prev) => {
        if (!prev) return null;

        const updatedUser = { ...prev };
        if (updates.name !== undefined) {
          updatedUser.name = updates.name;
          updatedUser.displayName = updates.name;
        }
        if (updates.photoURL !== undefined) {
          updatedUser.photoURL = updates.photoURL;
        }

        // Sauvegarder dans AsyncStorage
        saveUser(updatedUser);

        return updatedUser;
      });

      logger.debug("✅ Profil mis à jour avec succès");
      return true;
    } catch (err) {
      handleAuthError(err, setError, "Erreur lors de la mise à jour du profil");
      return false;
    }
  };

  /**
   * Réinitialise le mot de passe
   */
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setError(null);

      const result = await sendPasswordReset(email);

      if (!result.success) {
        setError(result.error || "Erreur lors de l'envoi de l'email");
        return false;
      }

      logger.debug("✅ Email de réinitialisation envoyé");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de l'envoi de l'email");
      return false;
    }
  };

  /**
   * Change l'email de l'utilisateur
   */
  const changeEmail = async (
    newEmail: string,
    currentPassword: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const result = await changeUserEmail(newEmail, currentPassword);

      if (!result.success) {
        setError(result.error || "Erreur lors du changement d'email");
        return false;
      }

      logger.debug("✅ Email mis à jour");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors du changement d'email");
      return false;
    }
  };

  /**
   * Change le mot de passe de l'utilisateur
   */
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const result = await changeUserPassword(currentPassword, newPassword);

      if (!result.success) {
        setError(result.error || "Erreur lors du changement de mot de passe");
        return false;
      }

      logger.debug("✅ Mot de passe mis à jour");
      return true;
    } catch (err: any) {
      handleAuthError(
        err,
        setError,
        "Erreur lors du changement de mot de passe"
      );
      return false;
    }
  };

  /**
   * Supprime le compte utilisateur
   */
  const deleteAccount = async (password: string): Promise<boolean> => {
    try {
      setError(null);

      const result = await deleteUserAccount(password);

      if (!result.success) {
        setError(result.error || "Erreur lors de la suppression du compte");
        return false;
      }

      logger.debug("✅ Compte supprimé");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la suppression du compte");
      return false;
    }
  };

  /**
   * Connexion avec Google (version native avec EAS Build)
   */
  const handleGoogleSignIn = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithGoogleSocial();

      if (!result.success) {
        setError(result.error || "Erreur lors de la connexion Google");
        return false;
      }

      // L'utilisateur sera automatiquement défini par l'écouteur Firebase
      logger.debug("✅ Connexion Google réussie");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la connexion Google");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion avec Apple (version native avec EAS Build)
   */
  const handleAppleSignIn = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithAppleSocial();

      if (!result.success) {
        setError(result.error || "Erreur lors de la connexion Apple");
        return false;
      }

      // L'utilisateur sera automatiquement défini par l'écouteur Firebase
      logger.debug("✅ Connexion Apple réussie");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la connexion Apple");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    currentUser: user,
    loading,
    isLoading: loading,
    error,
    // Actions
    signIn,
    signUp,
    signInAsGuest,
    signInWithGoogle: handleGoogleSignIn,
    signInWithApple: handleAppleSignIn,
    logout,
    updateUserProfile,
    resetPassword,
    changeEmail,
    changePassword,
    deleteAccount,

    // Utils
    refreshAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
