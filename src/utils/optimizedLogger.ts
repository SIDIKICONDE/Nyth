/**
 * Logger optimisé pour la mémoire AI
 */

export interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

export const createLogger = (namespace: string): Logger => {
  return {
    info: (message: string, data?: any) => {
      console.log(`[${namespace}] INFO: ${message}`, data);
    },
    warn: (message: string, data?: any) => {
      console.warn(`[${namespace}] WARN: ${message}`, data);
    },
    error: (message: string, data?: any) => {
      console.error(`[${namespace}] ERROR: ${message}`, data);
    },
    debug: (message: string, data?: any) => {
      console.debug(`[${namespace}] DEBUG: ${message}`, data);
    },
  };
};

// Alias for backward compatibility
export { createLogger as createOptimizedLogger };