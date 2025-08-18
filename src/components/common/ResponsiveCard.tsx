import React, { ReactNode } from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../contexts/ThemeContext';
import { dimensions } from '../../utils/responsive';

interface ResponsiveCardProps extends Omit<TouchableOpacityProps, 'style'> {
  children: ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  margin = 'none',
  fullWidth = true,
  style,
  disabled,
  onPress,
  ...props
}) => {
  const { moderateScale, isTablet } = useResponsive();
  const { currentTheme } = useTheme();

  const getPadding = () => {
    const paddings = {
      none: 0,
      small: dimensions.padding.small,
      medium: dimensions.padding.medium,
      large: dimensions.padding.large,
    };
    return paddings[padding];
  };

  const getMargin = () => {
    const margins = {
      none: 0,
      small: dimensions.margin.small,
      medium: dimensions.margin.medium,
      large: dimensions.margin.large,
    };
    return margins[margin];
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      padding: getPadding(),
      margin: getMargin(),
      borderRadius: dimensions.borderRadius.medium,
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: currentTheme.colors.surface,
          shadowColor: currentTheme.isDark ? '#000' : '#000',
          shadowOffset: {
            width: 0,
            height: moderateScale(2),
          },
          shadowOpacity: currentTheme.isDark ? 0.3 : 0.1,
          shadowRadius: moderateScale(3.84),
          elevation: 5,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: currentTheme.colors.background,
          borderWidth: 1,
          borderColor: currentTheme.colors.border,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: currentTheme.colors.surface,
        };
      default:
        return baseStyle;
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[getCardStyle(), style]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      {children}
    </Container>
  );
};