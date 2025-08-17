import { Logger, LogLevel } from "../utils/logger";

/**
 * Configuration des logs pour l'application
 * Ce fichier permet de configurer le comportement du logger pour différents environnements
 */

// Configuration pour l'environnement de développement
export const setupDevLogs = () => {
  Logger.configure({
    minLevel: LogLevel.DEBUG,
    enableStack: true,
    groupByModule: true,
    redactSensitive: false, // En dev, on peut voir les données sensibles pour le débogage
  });
};

// Configuration pour l'environnement de production
export const setupProdLogs = () => {
  Logger.configure({
    minLevel: LogLevel.WARN, // En prod, on n'affiche que les warnings et erreurs
    enableStack: false,
    groupByModule: false,
    redactSensitive: true, // Masquer toujours les données sensibles en production
  });
};

// Configuration pour les tests
export const setupTestLogs = () => {
  Logger.configure({
    minLevel: LogLevel.NONE, // Désactiver les logs pendant les tests
    enableStack: false,
    groupByModule: false,
    redactSensitive: true,
  });
};

// Configuration par défaut selon l'environnement
export const setupDefaultLogs = () => {
  if (__DEV__) {
    setupDevLogs();
  } else {
    setupProdLogs();
  }
};

// Initialisation automatique du logger lors de l'import
setupDefaultLogs();
