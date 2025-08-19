import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp,  } from 'react-native-reanimated';
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
    <View style={tw`flex-row justify-between items-center`}>
      {/* Bouton de partage basique */}
      <Animated.View style={tw`flex-1 mr-2`} entering={FadeInUp.duration(500).delay(400)}>
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
            {t('preview.actions.basicShare', 'Partager')}
          </UIText>
        </Pressable>
      </Animated.View>

      {/* Bouton d'export principal */}
      <Animated.View style={tw`flex-1 ml-2`} entering={FadeInUp.duration(500).delay(200)}>
        <Pressable
          onPress={onExport}
          disabled={isExporting}
          style={({ pressed }) => [
            tw`rounded-2xl p-4 flex-row items-center justify-center`,
            {
              backgroundColor: isExporting ? `${exportColor}80` : exportColor,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <UIText size="lg" weight="bold" style={tw`text-white`}>
            {isExporting
              ? t('preview.actions.exporting', 'Export en cours...')
              : t('preview.actions.export', 'Exporter')}
          </UIText>
        </Pressable>
      </Animated.View>
    </View>
  );
}
