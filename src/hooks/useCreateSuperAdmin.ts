import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { UserRole } from "../types/user";
import {
  logAdminAccess,
  verifyAdminAccess,
} from "../config/adminConfig.secure";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
} from "@react-native-firebase/firestore";

interface CreateSuperAdminHook {
  loading: boolean;
  createSuperAdmin: (targetUserId?: string) => Promise<boolean>;
  promoteSelfToSuperAdmin: () => Promise<boolean>;
  demoteFromSuperAdmin: (targetUserId: string) => Promise<boolean>;
}

export const useCreateSuperAdmin = (): CreateSuperAdminHook => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { profile, refreshProfile } = useUserProfile();

  /**
   * Promouvoir l'utilisateur actuel au rang de super admin
   * ATTENTION: À utiliser uniquement en développement ou setup initial
   */
  const promoteSelfToSuperAdmin = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) {
      Alert.alert("Erreur", "Aucun utilisateur connecté");
      return false;
    }

    // Vérification de sécurité pour éviter les abus
    if (!__DEV__) {
      Alert.alert(
        "⚠️ Production Mode",
        "Cette fonction n'est disponible qu'en mode développement"
      );
      return false;
    }

    setLoading(true);

    try {
      // Log de la tentative
      logAdminAccess(user.uid, "promote_self_to_super_admin", false);

      // Mise à jour du profil utilisateur
      const db = getFirestore(getApp());
      const userRef = doc(collection(db, "users"), user.uid);
      await updateDoc(userRef, {
        role: UserRole.SUPER_ADMIN,
        promotedAt: new Date().toISOString(),
        promotedBy: "self-promotion",
      });

      // Actualiser le profil local
      await refreshProfile();

      // Log de succès
      logAdminAccess(user.uid, "promote_self_to_super_admin", true);

      Alert.alert("✅ Succès", "Vous êtes maintenant Super Admin", [
        {
          text: "OK",
          onPress: () => {
            // Optionnel: rediriger vers la page admin
          },
        },
      ]);

      return true;
    } catch (error) {
      logAdminAccess(user.uid, "promote_self_to_super_admin_error", false);

      Alert.alert("❌ Erreur", "Impossible de vous promouvoir en super admin");
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, refreshProfile]);

  /**
   * Créer un super admin (pour utilisateur existant)
   * Nécessite d'être déjà super admin
   */
  const createSuperAdmin = useCallback(
    async (targetUserId?: string): Promise<boolean> => {
      if (!user?.uid) {
        Alert.alert("Erreur", "Aucun utilisateur connecté");
        return false;
      }

      if (!targetUserId) {
        Alert.alert("Erreur", "ID utilisateur cible requis");
        return false;
      }

      // Vérifier que l'utilisateur actuel est super admin
      const isAuthorized = await verifyAdminAccess(user.uid);
      if (!isAuthorized) {
        Alert.alert(
          "⚠️ Accès Refusé",
          "Seul un Super Admin peut créer d'autres Super Admins"
        );
        return false;
      }

      setLoading(true);

      try {
        // Log de la tentative
        logAdminAccess(user.uid, `create_super_admin_${targetUserId}`, false);

        // Mise à jour du profil de l'utilisateur cible
        const db = getFirestore(getApp());
        const targetUserRef = doc(collection(db, "users"), targetUserId);
        await updateDoc(targetUserRef, {
          role: UserRole.SUPER_ADMIN,
          promotedAt: new Date().toISOString(),
          promotedBy: user.uid,
        });

        // Log de succès
        logAdminAccess(user.uid, `create_super_admin_${targetUserId}`, true);

        Alert.alert("✅ Succès", "Utilisateur promu Super Admin");
        return true;
      } catch (error) {
        logAdminAccess(
          user.uid,
          `create_super_admin_${targetUserId}_error`,
          false
        );

        Alert.alert("❌ Erreur", "Impossible de créer le super admin");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  /**
   * Rétrograder un super admin
   * Nécessite d'être super admin et ne peut pas se rétrograder soi-même
   */
  const demoteFromSuperAdmin = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      if (!user?.uid) {
        Alert.alert("Erreur", "Aucun utilisateur connecté");
        return false;
      }

      if (targetUserId === user.uid) {
        Alert.alert(
          "⚠️ Action Interdite",
          "Vous ne pouvez pas vous rétrograder vous-même"
        );
        return false;
      }

      // Vérifier que l'utilisateur actuel est super admin
      const isAuthorized = await verifyAdminAccess(user.uid);
      if (!isAuthorized) {
        Alert.alert("⚠️ Accès Refusé", "Super Admin requis");
        return false;
      }

      setLoading(true);

      try {
        // Log de la tentative
        logAdminAccess(user.uid, `demote_super_admin_${targetUserId}`, false);

        // Rétrograder vers admin simple
        const db = getFirestore(getApp());
        const targetUserRef = doc(collection(db, "users"), targetUserId);
        await updateDoc(targetUserRef, {
          role: UserRole.ADMIN,
          demotedAt: new Date().toISOString(),
          demotedBy: user.uid,
        });

        // Log de succès
        logAdminAccess(user.uid, `demote_super_admin_${targetUserId}`, true);

        Alert.alert("✅ Succès", "Super Admin rétrogradé vers Admin");
        return true;
      } catch (error) {
        logAdminAccess(
          user.uid,
          `demote_super_admin_${targetUserId}_error`,
          false
        );

        Alert.alert("❌ Erreur", "Impossible de rétrograder l'utilisateur");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  return {
    loading,
    createSuperAdmin,
    promoteSelfToSuperAdmin,
    demoteFromSuperAdmin,
  };
};
