import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import { GradientHeaderProps } from './types';
import { DecorativePattern } from './DecorativePattern';
import { BackButton } from './BackButton';

export const GradientHeader: React.FC<GradientHeaderProps> = ({ 
  currentTheme, 
  onBackPress, 
  children 
}) => {
  return (
    <View style={tw`relative`}>
      <LinearGradient
        colors={[...currentTheme.colors.gradient && currentTheme.colors.gradient.length >= 2 
          ? currentTheme.colors.gradient as [string, string, ...string[]]
          : [currentTheme.colors.primary, currentTheme.colors.secondary]
        ]}
        style={[
          { 
            height: 224,
            paddingBottom: 32,
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <DecorativePattern />
        {onBackPress && <BackButton onPress={onBackPress} />}
        {children}
      </LinearGradient>

      {/* Courbe en bas du gradient */}
      <View style={[
        tw`absolute bottom-0 left-0 right-0`,
        { 
          height: 32,
          backgroundColor: currentTheme.colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }
      ]} />
    </View>
  );
};
