import { createOptimizedLogger } from "./optimizedLogger";
export { createOptimizedLogger, disableConsoleLogs } from "./optimizedLogger";

/**
 * Service de logging centralisé pour l'application
 * Permet de contrôler facilement les logs selon l'environnement
 */

// Types de logs supportés
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Configuration du logger
interface LoggerConfig {
  minLevel: LogLevel;
  enableStack: boolean;
  groupByModule: boolean;
  redactSensitive: boolean;
}

// Valeurs par défaut selon l'environnement
const defaultConfig: LoggerConfig = {
  minLevel: __DEV__ ? LogLevel.INFO : LogLevel.WARN,
  enableStack: true,
  groupByModule: false,
  redactSensitive: false,
};

let config: LoggerConfig = { ...defaultConfig };

export class Logger {
  private moduleName: string;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  /**
   * Configure le comportement global du logger
   */
  static configure(newConfig: Partial<LoggerConfig>): void {
    config = { ...config, ...newConfig };
  }

  /**
   * Réinitialise la configuration aux valeurs par défaut
   */
  static resetConfig(): void {
    config = { ...defaultConfig };
  }

  /**
   * Log de niveau DEBUG - Pour informations détaillées en développement
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log de niveau INFO - Pour suivi du fonctionnement normal
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log de niveau WARN - Pour problèmes non bloquants
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log de niveau ERROR - Pour erreurs significatives
   */
  error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * Méthode interne pour gérer les logs selon la configuration
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    // Ne rien faire si le niveau est inférieur au minimum configuré
    if (level < config.minLevel) return;

    // Préparer le préfixe du message
    const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    const prefix = `[${timestamp}][${this.getLevelLabel(level)}][${
      this.moduleName
    }]`;

    // Traiter les données sensibles si nécessaire
    const safeData = data ? this.sanitizeData(data) : undefined;

    // Utiliser des groupes si configuré
    if (config.groupByModule) {
      console.groupCollapsed(`${prefix} ${message}`);
      if (safeData !== undefined) {
        console.log(safeData);
      }
      console.groupEnd();
    } else {
      // Mode d'affichage simple
      switch (level) {
        case LogLevel.DEBUG:
          if (safeData !== undefined) {
            console.log(`${prefix} ${message}`, safeData);
          } else {
            console.log(`${prefix} ${message}`);
          }
          break;
        case LogLevel.INFO:
          if (safeData !== undefined) {
            console.info(`${prefix} ${message}`, safeData);
          } else {
            console.info(`${prefix} ${message}`);
          }
          break;
        case LogLevel.WARN:
          if (safeData !== undefined) {
            console.warn(`${prefix} ${message}`, safeData);
          } else {
            console.warn(`${prefix} ${message}`);
          }
          break;
        case LogLevel.ERROR:
          if (safeData !== undefined) {
            console.error(`${prefix} ${message}`, safeData);
          } else {
            console.error(`${prefix} ${message}`);
          }
          if (config.enableStack && safeData instanceof Error) {
            console.error(safeData.stack as string);
          }
          break;
      }
    }
  }

  /**
   * Obtenir le label textuel pour un niveau de log
   */
  private getLevelLabel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "DEBUG";
      case LogLevel.INFO:
        return "INFO ";
      case LogLevel.WARN:
        return "WARN ";
      case LogLevel.ERROR:
        return "ERROR";
      default:
        return "?????";
    }
  }

  /**
   * Masque les informations sensibles dans les données de log
   */
  private sanitizeData(data: unknown): unknown {
    if (!config.redactSensitive) return data;
    if (data == null) return data;

    // Pour les erreurs, on ne modifie pas
    if (data instanceof Error) return data;

    // Pour les objets, on fait une copie profonde et on masque les données sensibles
    if (typeof data === "object") {
      const sanitized: any = Array.isArray(data)
        ? [...(data as unknown[])]
        : { ...(data as Record<string, unknown>) };

      // Liste de clés sensibles à masquer
      const sensitiveKeys = [
        "apiKey",
        "api_key",
        "token",
        "password",
        "secret",
        "authorization",
        "key",
        "Authentication",
        "Bearer",
      ];

      // Fonction récursive pour masquer les données sensibles
      const maskSensitiveData = (obj: any) => {
        if (!obj || typeof obj !== "object") return;

        Object.keys(obj).forEach((key) => {
          // Si la clé contient un mot sensible
          if (
            sensitiveKeys.some((sk) =>
              key.toLowerCase().includes(sk.toLowerCase())
            )
          ) {
            if (typeof obj[key] === "string") {
              // Masquer la valeur en gardant les 4 premiers caractères
              obj[key] = obj[key].substring(0, 4) + "****";
            }
          }

          // Récursion pour les objets imbriqués
          if (obj[key] && typeof obj[key] === "object") {
            maskSensitiveData(obj[key]);
          }
        });
      };

      maskSensitiveData(sanitized);
      return sanitized;
    }

    return data;
  }
}

// Exporte une fonction pratique pour créer des loggers
export function createLogger(moduleName: string): Logger {
  return new Logger(moduleName);
}

// Logger par défaut pour les modules qui n'ont pas besoin d'un logger spécifique
export const defaultLogger = new Logger("App");
