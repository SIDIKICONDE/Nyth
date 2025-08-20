/**
 * Cache Manager - Fichier de compatibilité
 * Maintient la compatibilité avec l'ancien code en réexportant depuis les nouveaux modules
 */

// Réexporter toutes les fonctions depuis le nouveau système modulaire
export {
  clearAllCache,
  getCacheSize,
  formatCacheSize,
  resetApplication,
  resetApplicationSettings,
  useCacheTranslation
} from './cache';

// Export des types si nécessaire
export type {
  CacheInfo,
  DirectoryCleanupResult,
  CacheSizeUnit,
  CacheSizeFormatOptions
} from './cache'; 