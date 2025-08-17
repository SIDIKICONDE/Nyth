import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from 'twrnc';

interface CacheActionsProps {
  hasCache: boolean;
  clearingCache: boolean;
  currentTheme: any;
  t: (key: string, defaultValue: string) => string;
  onClearCache: () => void;
}

const CacheActions: React.FC<CacheActionsProps> = ({
  hasCache,
  clearingCache,
  currentTheme,
  t,
  onClearCache,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(500).springify()}>
      {/* Bouton vider le cache avec gradient */}
      <TouchableOpacity
        onPress={onClearCache}
        disabled={clearingCache || !hasCache}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={hasCache && !clearingCache
            ? ['#ef4444', '#dc2626']
            : [`${currentTheme.colors.surface}30`, `${currentTheme.colors.surface}20`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            tw`p-4 rounded-xl flex-row items-center justify-center`,
            { 
              opacity: hasCache && !clearingCache ? 1 : 0.6,
              shadowColor: hasCache ? '#ef4444' : currentTheme.colors.surface,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: hasCache ? 0.2 : 0,
              shadowRadius: 5,
              elevation: hasCache ? 3 : 0,
            }
          ]}
        >
          {clearingCache ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={tw`ml-2 text-white font-bold`}>
                {t('aiSettings.cache.clearing', 'Nettoyage en cours...')}
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="delete-sweep"
                size={20}
                color="white"
              />
              <Text style={tw`ml-2 text-white font-bold`}>
                {hasCache 
                  ? t('aiSettings.cache.clearCache', 'Vider le cache')
                  : t('aiSettings.cache.noCache', 'Cache vide')
                }
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Info card */}
      <View style={[
        tw`mt-3 p-4 rounded-xl flex-row`,
        { 
          backgroundColor: currentTheme.colors.surface,
          borderWidth: 1,
          borderColor: `${currentTheme.colors.primary}20`,
        }
      ]}>
        <MaterialCommunityIcons
          name="information"
          size={20}
          color={currentTheme.colors.primary}
          style={tw`mt-0.5`}
        />
        <View style={tw`ml-3 flex-1`}>
          <Text style={[tw`text-xs leading-5`, { color: currentTheme.colors.text }]}>
            {t('aiSettings.cache.info', 'Le cache améliore les performances en stockant temporairement les réponses AI.')}
          </Text>
          <Text style={[tw`text-xs mt-1`, { color: currentTheme.colors.textSecondary }]}>
            {t('aiSettings.cache.infoTip', 'Videz le cache si vous rencontrez des problèmes')}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default CacheActions; 