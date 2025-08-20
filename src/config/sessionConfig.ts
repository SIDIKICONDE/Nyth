/**
 * Configuration de la gestion de session utilisateur
 */

export interface SessionConfig {
  // Durée d'expiration de session en jours (par défaut: 7 jours au lieu de 30)
  sessionExpiryDays: number;

  // Intervalle de vérification de la session en minutes (par défaut: 30 minutes)
  sessionCheckIntervalMinutes: number;

  // Durée maximale d'inactivité avant avertissement en minutes
  inactivityWarningMinutes: number;

  // Activer la prolongation automatique de session
  autoExtendSession: boolean;

  // Durée de grâce après expiration (en minutes) pour éviter les déconnexions brusques
  gracePeriodMinutes: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  // 🔥 CONFIGURATION PERSONNALISÉE : 7 jours au lieu de 30
  sessionExpiryDays: 7,

  // Vérifier la session toutes les 15 minutes
  sessionCheckIntervalMinutes: 15,

  // Avertir après 60 minutes d'inactivité
  inactivityWarningMinutes: 60,

  // Prolonger automatiquement la session
  autoExtendSession: true,

  // Période de grâce de 5 minutes
  gracePeriodMinutes: 5,
};

/**
 * Configuration actuelle de la session
 */
export const SESSION_CONFIG: SessionConfig = {
  ...DEFAULT_SESSION_CONFIG,
};

/**
 * Calcule le timestamp d'expiration de session
 */
export function getSessionExpiryTimestamp(): number {
  return Date.now() + (SESSION_CONFIG.sessionExpiryDays * 24 * 60 * 60 * 1000);
}

/**
 * Vérifie si la session est expirée
 */
export function isSessionExpired(lastActivity: number): boolean {
  const expiryTime = SESSION_CONFIG.sessionExpiryDays * 24 * 60 * 60 * 1000;
  return Date.now() - lastActivity > expiryTime;
}

/**
 * Obtient l'intervalle de vérification en millisecondes
 */
export function getSessionCheckInterval(): number {
  return SESSION_CONFIG.sessionCheckIntervalMinutes * 60 * 1000;
}
