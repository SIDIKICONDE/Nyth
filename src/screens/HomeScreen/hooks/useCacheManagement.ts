import { useEffect } from 'react';
import { Alert } from 'react-native';
import { getCacheSize, formatCacheSize, resetApplication } from '../../../utils/cacheManager';
import { useTranslation } from '../../../hooks/useTranslation';
import { CacheManagement } from '../types';

export function useCacheManagement(
  cacheSize: number,
  setCacheSize: (size: number) => void,
  isClearingCache: boolean,
  setIsClearingCache: (clearing: boolean) => void
): CacheManagement {
  const { t } = useTranslation();

  const loadCacheSize = async () => {
    try {
      const size = await getCacheSize();
      setCacheSize(size);
    } catch (error) {}
  };

  const handleClearCache = async () => {
    Alert.alert(
      t('settings.clearCache.title'),
      t('settings.clearCache.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearingCache(true);
              await resetApplication();
              await loadCacheSize();
              Alert.alert(
                t('settings.clearCache.success.title'),
                t('settings.clearCache.success.message')
              );
            } catch (error) {
              Alert.alert(
                t('settings.clearCache.error.title'),
                t('settings.clearCache.error.message')
              );
            } finally {
              setIsClearingCache(false);
            }
          }
        }
      ]
    );
  };

  // Charger la taille du cache au montage
  useEffect(() => {
    loadCacheSize();
  }, []);

  return {
    cacheSize,
    isClearingCache,
    loadCacheSize,
    handleClearCache,
  };
} 