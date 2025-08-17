/**
 * Configuration pour forcer la désactivation de Keychain
 * Utile pour les environnements où Keychain cause des problèmes
 */

// Définir cette variable à true pour forcer la désactivation de Keychain
export const FORCE_DISABLE_KEYCHAIN = false; // Mettre à false sur mobile en production

// Message de log
if (FORCE_DISABLE_KEYCHAIN) {}

/**
 * Vérifie si Keychain doit être désactivé
 */
export const shouldDisableKeychain = (): boolean => {
  // 1. Vérifier le flag de force
  if (FORCE_DISABLE_KEYCHAIN) {
    return true;
  }
  
  // 2. Vérifier les variables d'environnement
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.DISABLE_KEYCHAIN === 'true' || 
        process.env.FORCE_DISABLE_KEYCHAIN === 'true') {
      return true;
    }
  }
  
  // 3. Vérifier si on est sur Windows
  if (typeof process !== 'undefined' && process.platform === 'win32') {
    return true;
  }
  
  return false;
}; 