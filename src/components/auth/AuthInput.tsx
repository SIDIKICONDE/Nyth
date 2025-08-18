import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { responsiveFontSize, responsiveSpacing, responsiveHeight } from '../../utils/responsive';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon?: string;
  error?: string;
  isPassword?: boolean;
  isRequired?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  icon,
  error,
  isPassword = false,
  isRequired = false,
  style,
  ...textInputProps
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputTextColor = isDark ? '#ffffff' : '#1a1a1a';
  const placeholderColor = isDark ? '#8a8a8a' : '#6b7280';
  const borderColor = error
    ? '#ef4444'
    : isFocused
    ? currentTheme.colors.primary
    : isDark
    ? '#404040'
    : '#e5e7eb';
  const backgroundColor = isDark ? '#2a2a2a' : '#f9fafb';

  // Responsive values
  const labelFontSize = responsiveFontSize(14);
  const inputFontSize = responsiveFontSize(16);
  const iconSize = responsiveFontSize(20);
  const paddingHorizontal = responsiveSpacing(16);
  const paddingVertical = responsiveSpacing(12);
  const marginBottom = responsiveSpacing(16);
  const inputHeight = responsiveHeight(56);

  return (
    <View style={[tw`mb-4`, { marginBottom }]}>
      <Text style={[
        tw`font-medium mb-2`,
        { 
          color: inputTextColor,
          fontSize: labelFontSize,
        }
      ]}>
        {label}
        {isRequired && <Text style={tw`text-red-500 ml-1`}>*</Text>}
      </Text>
      
      <View
        style={[
          tw`flex-row items-center rounded-xl border-2`,
          {
            backgroundColor,
            borderColor,
            paddingHorizontal,
            paddingVertical,
            minHeight: inputHeight,
          },
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={iconSize}
            color={placeholderColor}
            style={[tw`mr-3`, { marginRight: responsiveSpacing(12) }]}
          />
        )}
        
        <TextInput
          style={[
            tw`flex-1`,
            { 
              color: inputTextColor,
              fontSize: inputFontSize,
            },
            style,
          ]}
          placeholderTextColor={placeholderColor}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={[tw`ml-2`, { marginLeft: responsiveSpacing(8) }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={iconSize}
              color={placeholderColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[
          tw`text-red-500 mt-1 ml-1`,
          { 
            fontSize: responsiveFontSize(12),
            marginTop: responsiveSpacing(4),
          }
        ]}>
          {error}
        </Text>
      )}
    </View>
  );
};
