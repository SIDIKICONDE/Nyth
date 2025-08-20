import React from "react";
import { getAuth } from "@react-native-firebase/auth";
import { DefaultApiKeyService } from "../../services/defaultApiKey";
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
import { saveUser, clearAuthStorage } from "./storage";
import { createUserProfile, syncLocalDataToFirebase } from "./syncUtils";
import { User } from "./types";
import { handleAuthError, notifyStateChange } from "./utils";
import { offlineManager } from "../../services/OfflineManager";
import {
  signInWithApple as signInWithAppleSocial,
  signInWithGoogle as signInWithGoogleSocial,
  signOutGoogle as signOutGoogleSocial,
} from "./socialAuth";

export type AuthActionsDeps = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  isGoogleSignInConfigured: boolean;
  isMountedRef: React.MutableRefObject<boolean>;
  lastUserStateRef: React.MutableRefObject<string>;
  logger: {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
};

export function createAuthActions(deps: AuthActionsDeps) {
  const {
    user,
    setUser,
    setLoading,
    setError,
    isGoogleSignInConfigured,
    isMountedRef,
    lastUserStateRef,
    logger,
  } = deps;

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithEmail(email, password);

      if (!result.success) {
        setError(result.error || "Erreur lors de la connexion");
        return false;
      }

      DefaultApiKeyService.configureDefaultOpenAIKey()
        .then((configured) => {
          if (configured) {
            logger.debug("✅ Clé OpenAI par défaut configurée après connexion");
          }
        })
        .catch((err) => {
          logger.warn("⚠️ Impossible de configurer la clé OpenAI après connexion:", err);
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

  const signInAsGuest = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

      setUser(guestUser);
      await saveUser(guestUser);
      try {
        await offlineManager.saveOfflineData('user', guestUser);
      } catch (e) {
        logger.warn('Impossible de sauvegarder l’utilisateur invité en cache hors ligne', e);
      }

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

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const result = await createAccount(email, password, name);

      if (!result.success) {
        setError(result.error || "Erreur lors de l'inscription");
        return false;
      }

      await createUserProfile(result.user.uid, email, name);
      await syncLocalDataToFirebase(result.user.uid, result.user.uid);

      setUser(result.user);
      await saveUser(result.user);
      try {
        await offlineManager.saveOfflineData('user', result.user);
      } catch (e) {
        logger.warn('Impossible de sauvegarder l’utilisateur inscrit en cache hors ligne', e);
      }

      DefaultApiKeyService.configureDefaultOpenAIKey()
        .then((configured) => {
          if (configured) {
            logger.debug("✅ Clé OpenAI par défaut configurée après inscription");
          }
        })
        .catch((err) => {
          logger.warn("⚠️ Impossible de configurer la clé OpenAI après inscription:", err);
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

  const logout = async () => {
    try {
      setLoading(true);

      const currentUserData = user;

      logger.debug("📤 Début de la déconnexion:", {
        currentUser: currentUserData?.uid,
        userType: currentUserData?.isGuest ? "Invité" : "Firebase",
      });

      if (currentUserData && !currentUserData.isGuest) {
        logger.debug("🔥 Déconnexion utilisateur Firebase:", currentUserData.uid);

        try {
          await signOutGoogleSocial();
        } catch (socialError) {
          logger.warn("⚠️ Erreur déconnexion Google:", socialError);
        }

        await clearAuthStorage(currentUserData.uid);

        const result = await signOutFirebase();
        if (!result.success) {
          setError(result.error || "Erreur lors de la déconnexion");
          return;
        }

        if (isMountedRef.current) {
          setUser(null);
          await notifyStateChange(null, "firebase_signout", lastUserStateRef);
        }

        logger.debug("✅ Déconnexion Firebase réussie");
      } else {
        logger.debug("⚠️ État incohérent détecté, nettoyage complet");

        await clearAuthStorage();

        try {
          await signOutFirebase();
          await signOutGoogleSocial();
        } catch (err) {
          logger.warn("Erreur signOut (ignorée):", err);
        }

        if (isMountedRef.current) {
          setUser(null);
          await notifyStateChange(null, "logout_cleanup", lastUserStateRef);
        }
      }
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la déconnexion");
      if (isMountedRef.current) {
        setUser(null);
        await notifyStateChange(null, "logout_error", lastUserStateRef);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const updateUserProfile = async (updates: { name?: string; photoURL?: string; }): Promise<boolean> => {
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

      setUser((prev) => {
        if (!prev) return null;

        const updatedUser = { ...prev } as User;
        if (updates.name !== undefined) {
          updatedUser.name = updates.name;
          updatedUser.displayName = updates.name;
        }
        if (updates.photoURL !== undefined) {
          updatedUser.photoURL = updates.photoURL;
        }

        saveUser(updatedUser);
        try {
          offlineManager.saveOfflineData('user', updatedUser);
        } catch (e) {
          logger.warn('Impossible de mettre à jour le cache hors ligne de l’utilisateur', e);
        }

        return updatedUser;
      });

      logger.debug("✅ Profil mis à jour avec succès");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la mise à jour du profil");
      return false;
    }
  };

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

  const changeEmail = async (newEmail: string, currentPassword: string): Promise<boolean> => {
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

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
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
      handleAuthError(err, setError, "Erreur lors du changement de mot de passe");
      return false;
    }
  };

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

  const handleGoogleSignIn = async (): Promise<boolean> => {
    if (!isGoogleSignInConfigured) {
      const errorMessage = "La connexion Google n'est pas configurée. Vérifiez les clés API.";
      logger.error(errorMessage);
      setError(errorMessage);
      return false;
    }

    try {
      setError(null);
      setLoading(true);

      const result = await signInWithGoogleSocial();

      if (!result.success) {
        setError(result.error || "Erreur lors de la connexion Google");
        return false;
      }

      logger.debug("✅ Connexion Google réussie");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la connexion Google");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithAppleSocial();

      if (!result.success) {
        setError(result.error || "Erreur lors de la connexion Apple");
        return false;
      }

      logger.debug("✅ Connexion Apple réussie");
      return true;
    } catch (err: any) {
      handleAuthError(err, setError, "Erreur lors de la connexion Apple");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    signInAsGuest,
    signUp,
    logout,
    updateUserProfile,
    resetPassword,
    changeEmail,
    changePassword,
    deleteAccount,
    handleGoogleSignIn,
    handleAppleSignIn,
  };
}


