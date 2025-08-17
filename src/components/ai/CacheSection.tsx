import * as React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from 'twrnc';

import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { CacheSectionProps } from './cache-section/types';
import { formatSize, calculateUsagePercentage } from './cache-section/utils/formatters';
import { createTranslationWrapper } from './cache-section/utils/translation';
import { useCacheAnimation } from './cache-section/hooks/useCacheAnimation';
import CacheHeader from './cache-section/components/CacheHeader';
import CacheProgressBar from './cache-section/components/CacheProgressBar';
import CacheStats from './cache-section/components/CacheStats';
import CacheActions from './cache-section/components/CacheActions';

const CacheSection: React.FC<CacheSectionProps> = ({
  cacheStats,
  clearingCache,
  clearCache,
  refreshCacheStats
}) => {
  const { currentTheme } = useTheme();
  const { t: originalT } = useTranslation();
  const t = createTranslationWrapper(originalT);
  const { animatedRefreshStyle, handleRefresh } = useCacheAnimation();

  const sizeInfo = formatSize(cacheStats.sizeInBytes, currentTheme.colors.textSecondary);
  const hasCache = cacheStats.entryCount > 0;
  const usagePercentage = calculateUsagePercentage(cacheStats.sizeInBytes);

  return (
    <Animated.View 
      entering={FadeInDown.delay(100).springify()}
    >
      {/* En-tête avec gradient */}
      <View style={[
        tw`mb-3 rounded-xl overflow-hidden`,
        {
          backgroundColor: currentTheme.colors.surface,
          shadowColor: currentTheme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 2,
        }
      ]}>
        <LinearGradient
          colors={hasCache 
            ? [`${currentTheme.colors.primary}20`, `${currentTheme.colors.primary}05`]
            : [`${currentTheme.colors.surface}50`, `${currentTheme.colors.surface}20`]
          }
          style={tw`p-4`}
        >
          <CacheHeader
            cacheStats={cacheStats}
            hasCache={hasCache}
            currentTheme={currentTheme}
            t={t}
            animatedRefreshStyle={animatedRefreshStyle}
            onRefresh={() => handleRefresh(refreshCacheStats)}
          />

          {/* Barre de progression visuelle */}
          {hasCache && (
            <CacheProgressBar
              usagePercentage={usagePercentage}
              sizeInfo={sizeInfo}
              currentTheme={currentTheme}
            />
          )}

          {/* Statistiques en grille */}
          <CacheStats
            cacheStats={cacheStats}
            sizeInfo={sizeInfo}
            currentTheme={currentTheme}
            t={t}
          />
        </LinearGradient>
      </View>

      {/* Actions */}
      <CacheActions
        hasCache={hasCache}
        clearingCache={clearingCache}
        currentTheme={currentTheme}
        t={t}
        onClearCache={clearCache}
      />
    </Animated.View>
  );
};

export default CacheSection; 