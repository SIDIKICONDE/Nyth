import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import { GradientHeaderProps } from './types';
import { DecorativePattern } from './DecorativePattern';
import { BackButton } from './BackButton';
import { responsiveSpacing, responsiveHeight } from '../../../../utils/responsive';

export const GradientHeader: React.FC<GradientHeaderProps> = ({ 
  currentTheme, 
  onBackPress, 
  children 
}) => {
  const headerHeight = responsiveHeight(224);
  const paddingBottom = responsiveSpacing(32);
  const curveHeight = responsiveSpacing(32);
  const borderRadius = responsiveSpacing(24);
  
  return (
    <View style={tw`relative`}>
      <LinearGradient
        colors={[...currentTheme.colors.gradient && currentTheme.colors.gradient.length >= 2 
          ? currentTheme.colors.gradient as [string, string, ...string[]]
          : [currentTheme.colors.primary, currentTheme.colors.secondary]
        ]}
        style={[
          { 
            height: headerHeight,
            paddingBottom,
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
          height: curveHeight,
          backgroundColor: currentTheme.colors.background,
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
        }
      ]} />
    </View>
  );
}; 