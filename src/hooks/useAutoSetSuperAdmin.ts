import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "@react-native-firebase/firestore";
import { useEffect, useRef } from "react";
import { SUPER_ADMIN_UIDS } from "../config/adminConfig";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { UserRole, UserProfile } from "../types/user";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("AutoSetSuperAdmin");

/**
 * Hook qui configure automatiquement le rôle super admin
 * pour les UIDs définis dans la configuration
 */
export const useAutoSetSuperAdmin = () => {
  const { currentUser } = useAuth();
  const { forceReloadProfile } = useUserProfile();
  const hasChecked = useRef(false);

  useEffect(() => {
    const setSuperAdminRole = async () => {
      // Éviter les exécutions multiples
      if (hasChecked.current) return;
      if (!currentUser?.uid) return;

      // Vérifier si l'UID est dans la liste des super admins
      if (SUPER_ADMIN_UIDS.includes(currentUser.uid)) {
        hasChecked.current = true;

        try {
          logger.info(
            "Configuration automatique du rôle super admin pour:",
            currentUser.uid
          );

          const db = getFirestore(getApp());
          const userRef = doc(collection(db, "users"), currentUser.uid);

          // Vérifier d'abord si le document existe
          const userDoc = await getDoc(userRef);
          let roleUpdated = false;

          if (!userDoc.exists) {
            logger.info("Document utilisateur non trouvé, création...");

            // Créer le document avec le rôle super admin
            const userData = {
              uid: currentUser.uid,
              role: UserRole.SUPER_ADMIN,
              email: currentUser.email || "",
              displayName:
                currentUser.displayName ||
                currentUser.name ||
                currentUser.email?.split("@")[0] ||
                "Admin",
              photoURL: currentUser.photoURL || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              notifications: {
                email: true,
                push: true,
                achievements: true,
                updates: true,
              },
              privacy: {
                profileVisibility: "public",
                showEmail: false,
                showStats: true,
                allowMessages: true,
              },
              stats: {
                scriptsCreated: 0,
                videosRecorded: 0,
                totalRecordingTime: 0,
                scriptsGenerated: 0,
                achievementsUnlocked: 0,
              },
              profilePreferences: {
                showEmail: true,
                showStats: true,
                showAchievements: false,
                showBio: true,
              },
            };

            await setDoc(userRef, userData);
            logger.info("✅ Document utilisateur créé avec rôle super admin");
            roleUpdated = true;
          } else {
            // Le document existe, vérifier le rôle
            const existingData = userDoc.data() as UserProfile;

            if (existingData && existingData.role !== UserRole.SUPER_ADMIN) {
              logger.info("Mise à jour du rôle existant vers super admin");

              // Mettre à jour seulement le rôle
              await updateDoc(userRef, {
                role: UserRole.SUPER_ADMIN,
                updatedAt: new Date().toISOString(),
              });

              logger.info("✅ Rôle super admin mis à jour avec succès");
              roleUpdated = true;
            } else {
              logger.info("✅ L'utilisateur a déjà le rôle super admin");
            }
          }

          // Si le rôle a été mis à jour, forcer le rechargement du profil
          if (roleUpdated) {
            logger.info("🔄 Rechargement du profil après mise à jour du rôle");
            await forceReloadProfile();
          }
        } catch (error) {
          logger.error(
            "Erreur lors de la configuration du rôle super admin:",
            error
          );
          // Réinitialiser pour permettre une nouvelle tentative
          hasChecked.current = false;
        }
      }
    };

    setSuperAdminRole();
  }, [currentUser?.uid, forceReloadProfile]);
};
