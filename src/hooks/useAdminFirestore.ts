import { useCallback } from "react";
import { useFirestoreDocument } from "./useFirestoreDocument";
import { useAuth } from "../contexts/AuthContext";
import { useAdmin } from "./useAdmin";
import { UserRole } from "../types/user";

export const useAdminFirestore = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useAdmin();
  const { loading, error, updateDocument } = useFirestoreDocument({
    collection: "users",
    showErrorAlerts: true,
  });

  // Mettre à jour le rôle d'un utilisateur (Super Admin uniquement)
  const updateUserRole = useCallback(
    async (userId: string, newRole: UserRole): Promise<boolean> => {
      if (!user || !isSuperAdmin) {
        return false;
      }

      return updateDocument(userId, { role: newRole });
    },
    [user, isSuperAdmin, updateDocument]
  );

  // Activer/Désactiver un utilisateur
  const toggleUserStatus = useCallback(
    async (userId: string, isActive: boolean): Promise<boolean> => {
      if (!user || !isSuperAdmin) {
        return false;
      }

      return updateDocument(userId, {
        isActive,
        statusUpdatedBy: user.uid,
        statusUpdatedAt: new Date().toISOString(),
      });
    },
    [user, isSuperAdmin, updateDocument]
  );

  // Réinitialiser le mot de passe d'un utilisateur (envoyer email)
  const resetUserPassword = useCallback(
    async (userEmail: string): Promise<boolean> => {
      if (!user || !isSuperAdmin) {
        return false;
      }

      try {
        const auth = await import("@react-native-firebase/auth");
        await auth.default().sendPasswordResetEmail(userEmail);
        return true;
      } catch (error) {
        return false;
      }
    },
    [user, isSuperAdmin]
  );

  // Ajouter une note admin sur un utilisateur
  const addAdminNote = useCallback(
    async (userId: string, note: string): Promise<boolean> => {
      if (!user || !isSuperAdmin) {
        return false;
      }

      return updateDocument(userId, {
        adminNotes: {
          [Date.now()]: {
            note,
            addedBy: user.uid,
            addedAt: new Date().toISOString(),
          },
        },
      });
    },
    [user, isSuperAdmin, updateDocument]
  );

  return {
    loading,
    error,
    updateUserRole,
    toggleUserStatus,
    resetUserPassword,
    addAdminNote,
  };
};
