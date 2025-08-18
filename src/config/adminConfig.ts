/**
 * Configuration des administrateurs
 *
 * IMPORTANT: Ce fichier contient les UIDs des super administrateurs
 * Ne pas commiter ce fichier avec des UIDs en production
 */

// UIDs des super administrateurs
// Ces utilisateurs ont tous les droits dans l'application
export const SUPER_ADMIN_UIDS = [
 
];

/**
 * Vérifie si un UID est un super admin
 */
export const isSuperAdminUID = (uid: string | undefined): boolean => {
  if (!uid) return false;
  return SUPER_ADMIN_UIDS.includes(uid);
};

/**
 * Configuration des rôles par défaut
 */
export const DEFAULT_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
} as const;
