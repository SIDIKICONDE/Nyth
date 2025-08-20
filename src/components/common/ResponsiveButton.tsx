import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveText } from './ResponsiveText';
import { dimensions } from '../../utils/responsive';

interface ResponsiveButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const { moderateScale } = useResponsive();
  const { currentTheme } = useTheme();

  const getButtonHeight = (): number => {
    const heights = {
      small: dimensions.buttonHeight.small,
      medium: dimensions.buttonHeight.medium,
      large: dimensions.buttonHeight.large,
    };
    
    return heights[size];
  };

  const getButtonPadding = (): number => {
    const paddings = {
      small: moderateScale(12),
      medium: moderateScale(16),
      large: moderateScale(20),
    };
    
    return paddings[size];
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: getButtonHeight(),
      paddingHorizontal: getButtonPadding(),
      borderRadius: dimensions.borderRadius.medium,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...(fullWidth && { width: '100%' }),
    };

    const disabledColor = currentTheme.isDark ? '#374151' : '#D1D5DB';

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled 
            ? disabledColor 
            : currentTheme.colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled 
            ? disabledColor 
            : currentTheme.colors.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled 
            ? disabledColor 
            : currentTheme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return currentTheme.isDark ? '#6B7280' : '#9CA3AF';
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return currentTheme.colors.primary;
      default:
        return currentTheme.colors.text;
    }
  };

  const getTextVariant = (): 'body' | 'caption' | 'small' => {
    switch (size) {
      case 'large':
        return 'body';
      case 'medium':
        return 'caption';
      case 'small':
        return 'small';
      default:
        return 'caption';
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={getTextColor()} />;
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <View style={{ marginRight: moderateScale(8) }}>{icon}</View>
        )}
        <ResponsiveText
          variant={getTextVariant()}
          color={getTextColor()}
          weight="medium"
          style={textStyle}
        >
          {title}
        </ResponsiveText>
        {icon && iconPosition === 'right' && (
          <View style={{ marginLeft: moderateScale(8) }}>{icon}</View>
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
