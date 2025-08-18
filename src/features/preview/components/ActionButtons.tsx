import React from 'react';
import { Pressable, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import tw from 'twrnc';
import { UIText } from '@/components/ui/Typography';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ActionButtonsProps } from '../types';

export function ActionButtons({
  isExporting,
  onExport,
  onBasicShare,
}: ActionButtonsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const exportColor = currentTheme.colors.primary;

  return (
    <View style={tw`space-y-4`}>
      {/* Bouton d'export principal */}
      <Animated.View entering={FadeInUp.duration(500).delay(200)}>
        <Pressable
          onPress={onExport}
          disabled={isExporting}
          style={({ pressed }) => [
            tw`rounded-2xl overflow-hidden`,
            {
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: exportColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          <LinearGradient
            colors={
              isExporting
                ? [`${exportColor}80`, `${exportColor}60`]
                : [exportColor, `${exportColor}E0`]
            }
            style={tw`p-4 flex-row items-center justify-center`}
          >
            <UIText size="lg" weight="bold" style={tw`text-white`}>
              {isExporting
                ? t('preview.actions.exporting', 'Export en cours...')
                : t('preview.actions.exportAndShare', 'Exporter et Partager')}
            </UIText>

            {isExporting && (
              <View style={tw`ml-3`}>
                <Animated.View
                  entering={FadeInRight.duration(300)}
                  style={[
                    tw`w-5 h-5 rounded-full border-2 border-white border-t-transparent`,
                    {
                      transform: [{ rotate: '45deg' }],
                    },
                  ]}
                />
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Bouton de partage basique */}
      <Animated.View entering={FadeInUp.duration(500).delay(400)}>
        <Pressable
          onPress={onBasicShare}
          disabled={isExporting}
          style={({ pressed }) => [
            tw`rounded-2xl border-2 border-gray-300 dark:border-gray-600 p-4 items-center`,
            {
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <UIText size="base" weight="medium" style={tw`text-gray-700 dark:text-gray-300`}>
            {t('preview.actions.basicShare', 'Partage Rapide')}
          </UIText>
        </Pressable>
      </Animated.View>
    </View>
  );
}
