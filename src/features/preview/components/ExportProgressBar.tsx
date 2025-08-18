import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import tw from 'twrnc';
import { UIText } from '@/components/ui/Typography';
import { useTheme } from '@/contexts/ThemeContext';
import { ExportProgressBarProps } from '../types';

export function ExportProgressBar({ progress, currentStep }: ExportProgressBarProps) {
  const { currentTheme } = useTheme();

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress}%`,
  }));

  React.useEffect(() => {
    // Animer la barre de progression
    progressAnimatedStyle.width = withTiming(`${progress}%`, { duration: 300 });
  }, [progress, progressAnimatedStyle]);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={tw`space-y-3`}>
      {/* Étape actuelle */}
      <View style={tw`flex-row items-center justify-between`}>
        <UIText size="sm" weight="medium" style={tw`text-gray-700 dark:text-gray-300`}>
          {currentStep}
        </UIText>
        <UIText size="sm" weight="medium" style={tw`text-gray-500 dark:text-gray-400`}>
          {progress}%
        </UIText>
      </View>

      {/* Barre de progression */}
      <View style={tw`h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <Animated.View
          style={[
            tw`h-full rounded-full`,
            progressAnimatedStyle,
            { backgroundColor: currentTheme.colors.primary },
          ]}
        />
      </View>
    </Animated.View>
  );
}
