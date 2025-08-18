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

  return (
    <View style={tw`mb-4`}>
      <Text style={[tw`text-sm font-medium mb-2`, { color: inputTextColor }]}>
        {label}
        {isRequired && <Text style={tw`text-red-500 ml-1`}>*</Text>}
      </Text>
      
      <View
        style={[
          tw`flex-row items-center rounded-xl px-4 py-3 border-2`,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={placeholderColor}
            style={tw`mr-3`}
          />
        )}
        
        <TextInput
          style={[
            tw`flex-1 text-base`,
            { color: inputTextColor },
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
            style={tw`ml-2`}
          >
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={placeholderColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
          {error}
        </Text>
      )}
    </View>
  );
};
