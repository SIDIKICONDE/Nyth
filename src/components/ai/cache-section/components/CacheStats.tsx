import * as React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

import { CacheStats as CacheStatsType, SizeInfo } from '../types';
import { formatDate } from '../utils/formatters';

interface CacheStatsProps {
  cacheStats: CacheStatsType;
  sizeInfo: SizeInfo;
  currentTheme: any;
  t: (key: string, defaultValue: string, params?: any) => string;
}

const CacheStats: React.FC<CacheStatsProps> = ({
  cacheStats,
  sizeInfo,
  currentTheme,
  t,
}) => {
  return (
    <View style={tw`flex-row flex-wrap -mx-1`}>
      {/* Nombre d'entrées */}
      <View style={tw`w-1/2 px-1 mb-2`}>
        <View style={[
          tw`p-3 rounded-xl`,
          { 
            backgroundColor: currentTheme.colors.background,
            borderWidth: 1,
            borderColor: `${currentTheme.colors.primary}20`
          }
        ]}>
          <MaterialCommunityIcons
            name="file-multiple"
            size={16}
            color={currentTheme.colors.primary}
          />
          <Text style={[tw`text-2xl font-bold mt-1`, { color: currentTheme.colors.text }]}>
            {cacheStats.entryCount}
          </Text>
          <Text style={[tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
            {t('aiSettings.cache.entries', 'Entrées')}
          </Text>
        </View>
      </View>

      {/* Taille totale */}
      <View style={tw`w-1/2 px-1 mb-2`}>
        <View style={[
          tw`p-3 rounded-xl`,
          { 
            backgroundColor: currentTheme.colors.background,
            borderWidth: 1,
            borderColor: `${sizeInfo.color}20`
          }
        ]}>
          <MaterialCommunityIcons
            name="harddisk"
            size={16}
            color={sizeInfo.color}
          />
          <Text style={[tw`text-2xl font-bold mt-1`, { color: sizeInfo.color }]}>
            {sizeInfo.text}
          </Text>
          <Text style={[tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
            {t('aiSettings.cache.size', 'Taille')}
          </Text>
        </View>
      </View>

      {/* Plus ancien */}
      <View style={tw`w-1/2 px-1`}>
        <View style={[
          tw`p-3 rounded-xl`,
          { 
            backgroundColor: currentTheme.colors.background,
            borderWidth: 1,
            borderColor: `${currentTheme.colors.border}50`
          }
        ]}>
          <MaterialCommunityIcons
            name="clock-start"
            size={16}
            color={currentTheme.colors.textSecondary}
          />
          <Text style={[tw`text-xs font-medium mt-1`, { color: currentTheme.colors.text }]}>
            {formatDate(cacheStats.oldestEntry, t)}
          </Text>
          <Text style={[tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
            {t('aiSettings.cache.oldest', 'Plus ancien')}
          </Text>
        </View>
      </View>

      {/* Plus récent */}
      <View style={tw`w-1/2 px-1`}>
        <View style={[
          tw`p-3 rounded-xl`,
          { 
            backgroundColor: currentTheme.colors.background,
            borderWidth: 1,
            borderColor: `${currentTheme.colors.accent}20`
          }
        ]}>
          <MaterialCommunityIcons
            name="clock-end"
            size={16}
            color={currentTheme.colors.accent}
          />
          <Text style={[tw`text-xs font-medium mt-1`, { color: currentTheme.colors.text }]}>
            {formatDate(cacheStats.newestEntry, t)}
          </Text>
          <Text style={[tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
            {t('aiSettings.cache.newest', 'Plus récent')}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CacheStats; 