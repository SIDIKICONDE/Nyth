import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";
import {
  UserProfile,
  UserProfileUpdate,
  UserStats,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_USER_STATS,
  DEFAULT_PROFILE_DISPLAY_PREFERENCES,
  UserRole,
} from "../types/user";
import { createLogger } from "../utils/optimizedLogger";
import { isSuperAdminUID } from "../config/adminConfig";

const logger = createLogger("UserProfileService");

class UserProfileService {
  private static instance: UserProfileService;

  private constructor() {}

  static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  async createProfile(
    uid: string,
    initialData: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const db = getFirestore(getApp());
      const userRef = doc(collection(db, "users"), uid);
      const now = new Date().toISOString();

      // Déterminer le rôle en fonction de l'UID
      let role = UserRole.USER;
      if (isSuperAdminUID(uid)) {
        role = UserRole.SUPER_ADMIN;
      }

      const profile: UserProfile = {
        uid,
        email: initialData.email || "",
        displayName: initialData.displayName || "",
        photoURL: initialData.photoURL || null,
        bio: initialData.bio || "",
        notifications: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...initialData.notifications,
        },
        privacy: {
          ...DEFAULT_PRIVACY_SETTINGS,
          ...initialData.privacy,
        },
        stats: { ...DEFAULT_USER_STATS, ...initialData.stats },
        profilePreferences: {
          ...DEFAULT_PROFILE_DISPLAY_PREFERENCES,
          ...initialData.profilePreferences,
        },
        role,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      await setDoc(userRef, profile);
      logger.info("Profil créé avec succès", { uid });
      return profile;
    } catch (error) {
      logger.error("Erreur création profil", { uid, error });
      throw error;
    }
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      logger.debug("Récupération profil", { uid });
      const db = getFirestore(getApp());
      const userRef = doc(collection(db, "users"), uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists) {
        logger.warn("Profil non trouvé", { uid });
        return null;
      }

      const data = docSnap.data() as UserProfile;
      logger.debug("Profil récupéré", { uid, hasData: !!data });
      return data;
    } catch (error) {
      logger.error("Erreur récupération profil", { uid, error });
      throw error;
    }
  }

  async updateProfile(
    uid: string,
    updates: UserProfileUpdate
  ): Promise<UserProfile> {
    try {
      const db = getFirestore(getApp());
      const userRef = doc(collection(db, "users"), uid);

      const updatePayload = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userRef, updatePayload as any);

      // Mettre à jour le profil d'authentification si nécessaire
      if (updates.displayName || updates.photoURL) {
        try {
          const currentUser = getAuth(getApp()).currentUser;
          if (currentUser) {
            await currentUser.updateProfile({
              photoURL: updates.photoURL
                ? updates.photoURL
                : currentUser.photoURL,
              displayName: updates.displayName
                ? updates.displayName
                : currentUser.displayName,
            });
          }
        } catch (authError) {
          logger.warn("Erreur mise à jour profil auth", { authError });
        }
      }

      // Récupérer le profil mis à jour
      const updatedProfile = await this.getProfile(uid);
      if (!updatedProfile) {
        throw new Error("Profil non trouvé après mise à jour");
      }

      logger.info("Profil mis à jour", { uid });
      return updatedProfile;
    } catch (error) {
      logger.error("Erreur mise à jour profil", { uid, error });
      throw error;
    }
  }

  async updateUserStats(uid: string, stats: Partial<UserStats>): Promise<void> {
    const profile = await this.getProfile(uid);
    if (!profile) return;

    await this.updateProfile(uid, {
      stats: {
        ...DEFAULT_USER_STATS,
        ...profile.stats,
        ...stats,
      },
    });
  }

  async incrementStats(
    uid: string,
    field: keyof UserStats,
    value: number = 1
  ): Promise<void> {
    const profile = await this.getProfile(uid);
    if (!profile || !profile.stats) return;

    const currentValue = (profile.stats[field] as number) || 0;
    await this.updateUserStats(uid, {
      [field]: currentValue + value,
    });
  }

  async updateLastActiveAt(uid: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const userRef = doc(collection(db, "users"), uid);
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Erreur mise à jour lastLoginAt", { uid, error });
      throw error;
    }
  }

  async deleteProfile(uid: string): Promise<void> {
    // Note: La suppression de documents n'est généralement pas recommandée.
    // Il est préférable de marquer l'utilisateur comme "supprimé".
    // Cette fonction est conservée pour la complétude de l'API mais son usage est à discuter.
    try {
      const db = getFirestore(getApp());
      const userRef = doc(collection(db, "users"), uid);
      await updateDoc(userRef, {
        displayName: "Utilisateur supprimé",
        email: `deleted-${uid}@example.com`,
        role: UserRole.USER,
        privacy: { ...DEFAULT_PRIVACY_SETTINGS, profileVisibility: "private" },
        updatedAt: new Date().toISOString(),
      });
      logger.info('Profil "supprimé" (anonymisé)', { uid });
    } catch (error) {
      logger.error("Erreur suppression profil", { uid, error });
      throw error;
    }
  }
}

export default UserProfileService.getInstance();
