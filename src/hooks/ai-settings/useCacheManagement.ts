import { useState } from 'react';
import { Alert } from 'react-native';
import { CacheManager } from '../../services/ai/CacheManager';
import { CacheStats } from './types';
import { useTranslation } from '../useTranslation';

export const useCacheManagement = () => {
  const { t } = useTranslation();
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    entryCount: 0,
    sizeInBytes: 0,
    oldestEntry: 0,
    newestEntry: 0
  });

  // Load cache statistics
  const refreshCacheStats = async (): Promise<void> => {
    try {
      const stats = await CacheManager.getCacheStats();
      setCacheStats(stats);
    } catch (error) {}
  };

  // Clear all cache
  const clearCache = async (): Promise<void> => {
    try {
      setClearingCache(true);
      await CacheManager.clearCache();
      await refreshCacheStats();
      Alert.alert(
        t('aiSettings.cache.clearSuccess'),
        t('aiSettings.cache.clearSuccessMessage')
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('aiSettings.cache.clearError')
      );
    } finally {
      setClearingCache(false);
    }
  };

  // Clear cache for specific provider
  const clearCacheForProvider = async (provider: string): Promise<void> => {
    try {
      await CacheManager.clearCacheForProvider(provider);
      await refreshCacheStats();
    } catch (error) {}
  };

  // Get cache size in human readable format
  const getFormattedCacheSize = (): string => {
    const bytes = cacheStats.sizeInBytes;
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    clearingCache,
    cacheStats,
    refreshCacheStats,
    clearCache,
    clearCacheForProvider,
    getFormattedCacheSize,
  };
}; 