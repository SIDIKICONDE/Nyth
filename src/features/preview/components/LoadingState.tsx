import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import tw from 'twrnc';
import { UIText } from '@/components/ui/Typography';
import { useTheme } from '@/contexts/ThemeContext';

export function LoadingState() {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`flex-1 items-center justify-center`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <Animated.View entering={FadeIn.duration(600)} style={tw`items-center`}>
        {/* Indicateur de chargement animé */}
        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={[
            tw`w-16 h-16 rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 mb-6`,
            {
              borderTopColor: currentTheme.colors.primary,
            },
          ]}
        />

        {/* Texte de chargement */}
        <Animated.View entering={FadeInUp.duration(800).delay(400)}>
          <UIText size="xl" weight="medium" style={tw`text-gray-700 dark:text-gray-300 mb-2`}>
            Chargement de l'aperçu...
          </UIText>
          <UIText size="base" style={tw`text-gray-500 dark:text-gray-400 text-center`}>
            Préparation de votre vidéo
          </UIText>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
