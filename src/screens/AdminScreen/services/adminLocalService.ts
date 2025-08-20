import { createLogger } from "../../../utils/optimizedLogger";
import { AdminTab } from "../types";

const logger = createLogger("AdminLocalService");

/**
 * Service local pour les fonctionnalités administratives
 * Gère les opérations qui ne nécessitent pas de Cloud Functions
 */
class AdminLocalService {
  /**
   * Validation des permissions côté client
   */
  validateTabAccess(tab: AdminTab, userRole: string): boolean {
    const adminOnlyTabs: AdminTab[] = [
      'controls', 'aiControl', 'networkControl', 'featureControl',
      'dataManagement', 'themeControl', 'session', 'banManagement',
      'appLock', 'messaging', 'systemLogs'
    ];

    const superAdminOnlyTabs: AdminTab[] = [
      'controls', 'aiControl', 'networkControl', 'dataManagement'
    ];

    if (superAdminOnlyTabs.includes(tab)) {
      return userRole === 'super_admin';
    }

    if (adminOnlyTabs.includes(tab)) {
      return ['admin', 'super_admin'].includes(userRole);
    }

    return true; // Onglets publics (dashboard, users, stats, etc.)
  }

  /**
   * Filtrage des données selon les permissions
   */
  filterDataByPermissions<T extends Record<string, any>>(
    data: T[],
    userRole: string,
    sensitiveFields: string[] = []
  ): T[] {
    if (userRole === 'super_admin') {
      return data; // Super admin voit tout
    }

    // Filtrer les champs sensibles pour les utilisateurs normaux
    return data.map(item => {
      const filtered = { ...item };
      if (userRole === 'user') {
        sensitiveFields.forEach(field => {
          delete filtered[field];
        });
      }
      return filtered;
    });
  }

  /**
   * Cache local pour les données temporaires
   */
  private localCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  setCache<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
    this.localCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: expiresAt
    });
  }

  getCache<T>(key: string): T | null {
    const cached = this.localCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.ttl) {
      this.localCache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(key?: string): void {
    if (key) {
      this.localCache.delete(key);
    } else {
      this.localCache.clear();
    }
  }

  /**
   * Gestion des préférences utilisateur
   */
  saveUserPreferences(userId: string, preferences: Record<string, any>): void {
    try {
      const key = `user_preferences_${userId}`;
      this.setCache(key, preferences, 60 * 24); // 24h TTL
      logger.debug("Préférences utilisateur sauvegardées", { userId });
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde des préférences:", error);
    }
  }

  getUserPreferences(userId: string): Record<string, any> | null {
    try {
      const key = `user_preferences_${userId}`;
      return this.getCache(key);
    } catch (error) {
      logger.error("Erreur lors de la récupération des préférences:", error);
      return null;
    }
  }

  /**
   * Statistiques locales
   */
  calculateLocalStats(data: any[]): {
    total: number;
    average: number;
    min: number;
    max: number;
  } {
    if (!data.length) {
      return { total: 0, average: 0, min: 0, max: 0 };
    }

    const values = data.map(item =>
      typeof item === 'number' ? item : parseFloat(item) || 0
    );

    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { total, average, min, max };
  }

  /**
   * Validation de sécurité locale
   */
  validateInput(input: string, rules: {
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    allowedChars?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (rules.maxLength && input.length > rules.maxLength) {
      errors.push(`Longueur maximale: ${rules.maxLength} caractères`);
    }

    if (rules.minLength && input.length < rules.minLength) {
      errors.push(`Longueur minimale: ${rules.minLength} caractères`);
    }

    if (rules.pattern && !rules.pattern.test(input)) {
      errors.push("Format invalide");
    }

    if (rules.allowedChars) {
      const invalidChars = input.split('').filter(char =>
        !rules.allowedChars!.includes(char)
      );
      if (invalidChars.length > 0) {
        errors.push(`Caractères non autorisés: ${invalidChars.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatage des données pour l'affichage
   */
  formatData(data: any, type: 'currency' | 'percentage' | 'date' | 'number'): string {
    try {
      switch (type) {
        case 'currency':
          return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
          }).format(data);

        case 'percentage':
          return `${(data * 100).toFixed(1)}%`;

        case 'date':
          return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(data));

        case 'number':
          return new Intl.NumberFormat('fr-FR').format(data);

        default:
          return String(data);
      }
    } catch (error) {
      logger.error("Erreur de formatage:", error);
      return String(data);
    }
  }

  /**
   * Nettoyage automatique du cache expiré
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.localCache.entries()) {
      if (now > value.ttl) {
        this.localCache.delete(key);
      }
    }
    logger.debug("Nettoyage du cache local terminé");
  }
}

export const adminLocalService = new AdminLocalService();

// Nettoyage automatique toutes les 5 minutes
setInterval(() => {
  adminLocalService.cleanup();
}, 5 * 60 * 1000);
