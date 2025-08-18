import React from 'react';
import { View, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import tw from 'twrnc';
import { UIText } from '@/components/ui/Typography';
import { useTheme } from '@/contexts/ThemeContext';

interface NotFoundStateProps {
  onRetry?: () => void;
}

export function NotFoundState({ onRetry }: NotFoundStateProps) {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`flex-1 items-center justify-center px-6`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <Animated.View entering={FadeIn.duration(600)} style={tw`items-center`}>
        {/* Icône d'erreur */}
        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={tw`w-20 h-20 rounded-full bg-red-100 dark:bg-red-900 items-center justify-center mb-6`}
        >
          <UIText size="3xl">❌</UIText>
        </Animated.View>

        {/* Message d'erreur */}
        <Animated.View entering={FadeInUp.duration(800).delay(400)} style={tw`items-center mb-8`}>
          <UIText size="xl" weight="bold" style={tw`text-gray-800 dark:text-gray-200 mb-3 text-center`}>
            Vidéo introuvable
          </UIText>
          <UIText size="base" style={tw`text-gray-600 dark:text-gray-400 text-center leading-6`}>
            La vidéo que vous recherchez n'a pas pu être trouvée ou a été supprimée.
          </UIText>
        </Animated.View>

        {/* Bouton de retry */}
        {onRetry && (
          <Animated.View entering={FadeInUp.duration(800).delay(600)}>
            <Pressable
              onPress={onRetry}
              style={({ pressed }) => [
                tw`px-6 py-3 rounded-2xl`,
                {
                  backgroundColor: currentTheme.colors.primary,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <UIText size="base" weight="medium" style={tw`text-white`}>
                Réessayer
              </UIText>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
