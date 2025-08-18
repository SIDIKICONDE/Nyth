import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveText } from '../common/ResponsiveText';
import { dimensions } from '../../utils/responsive';

interface ResponsiveAuthButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'social';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const ResponsiveAuthButton: React.FC<ResponsiveAuthButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const { moderateScale, isTablet } = useResponsive();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: dimensions.padding.large,
      minHeight: isTablet ? moderateScale(56) : moderateScale(48),
      borderRadius: dimensions.borderRadius.medium,
      opacity: disabled || isLoading ? 0.6 : 1,
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: currentTheme.colors.primary,
          shadowColor: currentTheme.colors.primary,
          shadowOffset: { width: 0, height: moderateScale(4) },
          shadowOpacity: 0.3,
          shadowRadius: moderateScale(8),
          elevation: 5,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: isDark ? '#3a3a3a' : '#e5e7eb',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDark ? '#4a4a4a' : '#d1d5db',
        };
      case 'social':
        return {
          ...baseStyle,
          backgroundColor: isDark ? '#2a2a2a' : '#f9fafb',
          borderWidth: 1,
          borderColor: isDark ? '#3a3a3a' : '#e5e7eb',
        };
      default:
        return baseStyle;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return isDark ? '#ffffff' : '#1f2937';
      case 'outline':
      case 'social':
        return isDark ? '#e5e5e5' : '#374151';
      default:
        return currentTheme.colors.text;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color={getTextColor()} size="small" />;
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <MaterialCommunityIcons
            name={icon}
            size={moderateScale(20)}
            color={getTextColor()}
            style={{ marginRight: dimensions.margin.small }}
          />
        )}
        <ResponsiveText
          variant={isTablet ? 'body' : 'caption'}
          weight="medium"
          color={getTextColor()}
        >
          {title}
        </ResponsiveText>
        {icon && iconPosition === 'right' && (
          <MaterialCommunityIcons
            name={icon}
            size={moderateScale(20)}
            color={getTextColor()}
            style={{ marginLeft: dimensions.margin.small }}
          />
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};