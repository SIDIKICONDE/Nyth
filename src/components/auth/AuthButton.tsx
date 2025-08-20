import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { responsiveFontSize, responsiveSpacing, responsiveHeight } from '../../utils/responsive';

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  isLoading = false,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  disabled,
  style,
  ...touchableOpacityProps
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  
  const isDisabled = disabled || isLoading;
  
  // Responsive values
  const buttonHeight = responsiveHeight(56);
  const paddingHorizontal = responsiveSpacing(24);
  const paddingVertical = responsiveSpacing(16);
  const fontSize = responsiveFontSize(16);
  const iconSize = responsiveFontSize(20);
  
  const getButtonStyle = () => {
    const baseStyle = [
      tw`rounded-xl flex-row items-center justify-center`,
      {
        minHeight: buttonHeight,
        paddingHorizontal,
        paddingVertical,
      }
    ];
    
    switch (variant) {
      case 'primary':
        return [
          ...baseStyle,
          { opacity: isDisabled ? 0.6 : 1 },
        ];
      case 'secondary':
        return [
          ...baseStyle,
          {
            backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
            opacity: isDisabled ? 0.6 : 1,
          },
        ];
      case 'outline':
        return [
          ...baseStyle,
          tw`border-2`,
          {
            borderColor: currentTheme.colors.primary,
            backgroundColor: 'transparent',
            opacity: isDisabled ? 0.6 : 1,
          },
        ];
      default:
        return baseStyle;
    }
  };
  
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return isDark ? '#ffffff' : '#1f2937';
      case 'outline':
        return currentTheme.colors.primary;
      default:
        return '#ffffff';
    }
  };
  
  const ButtonContent = () => (
    <>
      {icon && iconPosition === 'left' && (
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={getTextColor()}
          style={[tw`mr-2`, { marginRight: responsiveSpacing(8) }]}
        />
      )}
      
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text
          style={[
            tw`font-semibold`,
            { 
              color: getTextColor(),
              fontSize,
            },
          ]}
        >
          {title}
        </Text>
      )}
      
      {icon && iconPosition === 'right' && !isLoading && (
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={getTextColor()}
          style={[tw`ml-2`, { marginLeft: responsiveSpacing(8) }]}
        />
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        disabled={isDisabled}
        style={style}
        {...touchableOpacityProps}
      >
        <LinearGradient
          colors={[currentTheme.colors.primary, currentTheme.colors.secondary]}
          style={[

            tw`w-full rounded-xl flex-row items-center justify-center`,
            {
              minHeight: buttonHeight,
              paddingHorizontal,
              paddingVertical,
            },
            { opacity: isDisabled ? 0.6 : 1 }
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <ButtonContent />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      disabled={isDisabled}
      style={[getButtonStyle(), style]}
      {...touchableOpacityProps}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};
