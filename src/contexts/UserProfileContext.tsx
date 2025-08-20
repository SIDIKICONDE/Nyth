import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  UserProfile,
  UserProfileUpdate,
  UserStats,
  UserRole,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_USER_STATS,
  DEFAULT_PROFILE_DISPLAY_PREFERENCES,
} from "../types/user";
import UserProfileService from "../services/UserProfileService";
import { useAuth } from "./AuthContext";
import { createLogger } from "../utils/optimizedLogger";
import { getAuth } from "@react-native-firebase/auth";

const logger = createLogger("UserProfileContext");

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
  refreshProfile: () => Promise<void>;
  incrementStat: (field: keyof UserStats, value?: number) => Promise<void>;
  forceReloadProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le profil quand l'utilisateur change
  useEffect(() => {
    if (user && user.uid) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user, user?.uid]);

  const loadProfile = async () => {
    if (!user || !user.uid) return;

    try {
      setIsLoading(true);
      setError(null);

      // Si c'est un compte invité, créer un profil local
      if (user.isGuest) {
        logger.info("👤 Compte invité détecté, création d'un profil local");
        const guestProfile: UserProfile = {
          uid: user.uid,
          email: null,
          displayName: user.displayName || "Invité",
          photoURL: null,
          role: UserRole.USER,
          notifications: DEFAULT_NOTIFICATION_PREFERENCES,
          privacy: DEFAULT_PRIVACY_SETTINGS,
          stats: DEFAULT_USER_STATS,
          profilePreferences: DEFAULT_PROFILE_DISPLAY_PREFERENCES,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setProfile(guestProfile);
        return;
      }

      let userProfile = await UserProfileService.getProfile(user.uid);

      // Si le profil n'existe pas dans Firestore, le créer
      if (!userProfile) {
        logger.info("👤 Profil non trouvé, création en cours...");

        // Récupérer aussi la photo depuis Firebase Auth si elle existe
        const currentUser = getAuth().currentUser;

        const initialProfileData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.name || "Nouvel utilisateur",
          photoURL: currentUser?.photoURL || user.photoURL,
        };
        userProfile = await UserProfileService.createProfile(
          user.uid,
          initialProfileData
        );
      } else {
        // Si le profil existe mais n'a pas de photo, vérifier Firebase Auth
        const currentUser = getAuth().currentUser;

        if (!userProfile.photoURL && currentUser?.photoURL) {
          logger.info("🔄 Synchronisation de la photo depuis Firebase Auth");
          userProfile = await UserProfileService.updateProfile(user.uid, {
            photoURL: currentUser.photoURL,
          });
        }
      }

      setProfile(userProfile);
    } catch (err) {
      logger.error("❌ Erreur lors du chargement du profil", err);
      setError("Impossible de charger le profil");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: UserProfileUpdate) => {
    if (!user || !profile) return;

    try {
      // Si c'est un compte invité, mettre à jour localement
      if (user.isGuest) {
        const updatedProfile = {
          ...profile,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        setProfile(updatedProfile);
        logger.info("✅ Profil invité mis à jour localement");
        return;
      }

      const updatedProfile = await UserProfileService.updateProfile(
        user.uid,
        updates
      );
      setProfile(updatedProfile);
    } catch (err) {
      logger.error("❌ Erreur lors de la mise à jour du profil", err);
      throw err;
    }
  };

  const incrementStat = async (field: keyof UserStats, value: number = 1) => {
    if (!user) return;

    try {
      // Si c'est un compte invité, mettre à jour localement
      if (user.isGuest && profile && profile.stats) {
        const currentValue = (profile.stats[field] as number) || 0;
        const updatedStats: UserStats = {
          ...profile.stats,
          [field]: currentValue + value,
        };
        const updatedProfile: UserProfile = {
          ...profile,
          stats: updatedStats,
          updatedAt: new Date().toISOString(),
        };
        setProfile(updatedProfile);
        logger.info("✅ Statistiques invité mises à jour localement");
        return;
      }

      await UserProfileService.incrementStats(user.uid, field, value);
      await loadProfile(); // Recharger le profil pour avoir les stats à jour
    } catch (err) {
      logger.error("❌ Erreur lors de la mise à jour des statistiques", err);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const forceReloadProfile = async () => {
    logger.info("🔄 Rechargement forcé du profil demandé");
    setProfile(null); // Réinitialiser le profil pour forcer un rechargement complet
    await loadProfile();
  };

  const value = {
    profile,
    isLoading,
    error,
    updateProfile,
    refreshProfile,
    incrementStat,
    forceReloadProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
