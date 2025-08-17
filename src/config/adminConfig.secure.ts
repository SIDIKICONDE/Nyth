/**
 * Configuration sécurisée des administrateurs
 *
 * SÉCURITÉ: Utilise des variables d'environnement pour masquer les UIDs sensibles
 */

// UIDs des super administrateurs depuis les variables d'environnement
// En production, définir dans .env ou Firebase config
const getSuperAdminUIDs = (): string[] => {
  const envUIDs = process.env.SUPER_ADMIN_UIDS;

  if (envUIDs) {
    return envUIDs.split(",").map((uid) => uid.trim());
  }

  // Fallback pour développement uniquement
  if (__DEV__) {
    return [
      "XcdyZToiSKTjf99Ju5yf9zUVQNb2", // Conde Sidiki - Super Admin principal
    ];
  }

  return [];
};

export const SUPER_ADMIN_UIDS = getSuperAdminUIDs();

/**
 * Vérifie si un UID est un super admin
 * Inclut une validation supplémentaire
 */
export const isSuperAdminUID = (uid: string | undefined): boolean => {
  if (!uid || uid.length < 10) return false; // Validation basique du format UID
  return SUPER_ADMIN_UIDS.includes(uid);
};

/**
 * Log des tentatives d'accès admin pour audit
 */
export const logAdminAccess = (
  uid: string,
  action: string,
  success: boolean
) => {
  if (__DEV__) {}

  // En production, envoyer vers un service de logging sécurisé
  // Par exemple: Analytics, Sentry, ou Firebase Analytics
};

/**
 * Vérification renforcée avec timeout
 */
export const verifyAdminAccess = async (uid: string): Promise<boolean> => {
  try {
    // Ajouter un délai pour éviter les attaques par timing
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );

    const isAuthorized = isSuperAdminUID(uid);
    logAdminAccess(uid, "verify_access", isAuthorized);

    return isAuthorized;
  } catch (error) {
    logAdminAccess(uid, "verify_access_error", false);
    return false;
  }
};
