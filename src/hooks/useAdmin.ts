import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { UserRole } from "../types/user";
import { isSuperAdminUID } from "../config/adminConfig";

interface AdminHook {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  checkPermission: (requiredRole: UserRole) => boolean;
}

export const useAdmin = (): AdminHook => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Une fois que le profil est chargé, on arrête le loading
    if (profile !== undefined) {
      setIsLoading(false);
    }
  }, [profile]);

  const checkPermission = (requiredRole: UserRole): boolean => {
    if (!profile?.role) return false;

    switch (requiredRole) {
      case UserRole.USER:
        // Tout le monde a au moins le rôle USER
        return true;
      case UserRole.ADMIN:
        // Les admins et super admins ont accès
        return (
          profile.role === UserRole.ADMIN ||
          profile.role === UserRole.SUPER_ADMIN
        );
      case UserRole.SUPER_ADMIN:
        // Seuls les super admins ont accès
        return profile.role === UserRole.SUPER_ADMIN;
      default:
        return false;
    }
  };

  const isAdmin =
    profile?.role === UserRole.ADMIN ||
    profile?.role === UserRole.SUPER_ADMIN ||
    isSuperAdminUID(user?.uid);
  const isSuperAdmin =
    profile?.role === UserRole.SUPER_ADMIN || isSuperAdminUID(user?.uid);

  return {
    isAdmin,
    isSuperAdmin,
    isLoading,
    checkPermission,
  };
};
