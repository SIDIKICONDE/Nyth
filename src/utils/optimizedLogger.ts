/**
 * Logger optimisé pour React Native
 * Désactive automatiquement tous les logs en production
 * Offre des niveaux de log et du formatage
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
  includeContext: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class OptimizedLogger {
  private config: LoggerConfig = {
    enabled: __DEV__,
    minLevel: __DEV__ ? "debug" : "error",
    includeTimestamp: __DEV__,
    includeContext: __DEV__,
  };

  private context: string;

  constructor(context: string = "App") {
    this.context = context;
  }

  /**
   * Configure le logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Formatage du message avec contexte et timestamp
   */
  private formatMessage(level: LogLevel, message: string): string {
    if (!this.config.enabled) return message;

    let formatted = "";

    if (this.config.includeTimestamp) {
      formatted += `[${new Date().toISOString()}] `;
    }

    if (this.config.includeContext) {
      formatted += `[${this.context}] `;
    }

    formatted += `[${level.toUpperCase()}] ${message}`;

    return formatted;
  }

  /**
   * Vérifie si le log doit être affiché
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Log de debug
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message), ...args);
    }
  }

  /**
   * Log d'information
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message), ...args);
    }
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message), ...args);
    }
  }

  /**
   * Log d'erreur
   */
  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message), error, ...args);

      // En production, envoyer les erreurs à un service de monitoring
      if (!__DEV__ && error instanceof Error) {
        this.reportError(error, message);
      }
    }
  }

  /**
   * Mesure de performance
   */
  time(label: string): void {
    if (this.shouldLog("debug")) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog("debug")) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }

  /**
   * Groupe de logs
   */
  group(label: string): void {
    if (this.shouldLog("debug")) {
      console.group(`[${this.context}] ${label}`);
    }
  }

  groupEnd(): void {
    if (this.shouldLog("debug")) {
      console.groupEnd();
    }
  }

  /**
   * Table de données
   */
  table(data: any): void {
    if (this.shouldLog("debug")) {
      console.table(data);
    }
  }

  /**
   * Rapport d'erreur en production (à implémenter avec votre service)
   */
  private reportError(error: Error, context: string): void {
    // TODO: Implémenter l'envoi vers Sentry, Bugsnag, etc.
    // Par exemple:
    // Sentry.captureException(error, {
    //   tags: { context: this.context },
    //   extra: { message: context }
    // });
  }
}

/**
 * Factory pour créer des loggers avec contexte
 */
export function createOptimizedLogger(context: string): OptimizedLogger {
  return new OptimizedLogger(context);
}

// Compatibilité: alias pour anciens imports
export const createLogger = createOptimizedLogger;

/**
 * Logger global par défaut
 */
export const logger = new OptimizedLogger("Global");

/**
 * Désactive tous les console.log en production
 */
export function disableConsoleLogs(): void {
  if (!__DEV__) {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.warn = () => {};
    // Garder console.error pour les erreurs critiques
  }
}

/**
 * Hook pour utiliser le logger dans les composants React
 */
import { useMemo } from "react";

export function useLogger(context: string): OptimizedLogger {
  return useMemo(() => createOptimizedLogger(context), [context]);
}
