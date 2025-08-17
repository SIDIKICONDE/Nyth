/**
 * Cache Manager - Point d'entrée principal
 * Exporte toutes les fonctions de gestion du cache
 */

export { 
  getCacheSize, 
  clearAllCache
} from './cacheOperations';

export { formatCacheSize } from './formatters';

export { resetApplication, resetApplicationSettings } from './resetManager';

export { cleanAllDirectories } from './directoryManager';

// Export des fonctions pour définir l'instance de traduction
export { setTranslationInstance as setCacheOperationsTranslation } from './cacheOperations';
export { setTranslationInstance as setFormattersTranslation } from './formatters';
export { setTranslationInstance as setDirectoryManagerTranslation } from './directoryManager';
export { setTranslationInstance as setResetManagerTranslation } from './resetManager';

// Export des types
export type { CacheInfo, DirectoryCleanupResult, CacheSizeUnit, CacheSizeFormatOptions } from './types';

// Export du hook pour l'initialisation des traductions
export { useCacheTranslation } from './useCacheTranslation'; 