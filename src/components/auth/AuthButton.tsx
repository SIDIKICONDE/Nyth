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
  
  const getButtonStyle = () => {
    const baseStyle = tw`rounded-xl py-4 px-6 flex-row items-center justify-center`;
    
    switch (variant) {
      case 'primary':
        return [
          baseStyle,
          { opacity: isDisabled ? 0.6 : 1 },
        ];
      case 'secondary':
        return [
          baseStyle,
          {
            backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
            opacity: isDisabled ? 0.6 : 1,
          },
        ];
      case 'outline':
        return [
          baseStyle,
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
          size={20}
          color={getTextColor()}
          style={tw`mr-2`}
        />
      )}
      
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text
          style={[
            tw`text-base font-semibold`,
            { color: getTextColor() },
          ]}
        >
          {title}
        </Text>
      )}
      
      {icon && iconPosition === 'right' && !isLoading && (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={getTextColor()}
          style={tw`ml-2`}
        />
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        disabled={isDisabled}
        style={[getButtonStyle(), style]}
        {...touchableOpacityProps}
      >
        <LinearGradient
          colors={[currentTheme.colors.primary, currentTheme.colors.secondary]}
          style={tw`w-full rounded-xl py-4 px-6 flex-row items-center justify-center`}
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
