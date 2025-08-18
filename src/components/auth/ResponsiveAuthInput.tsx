import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveText } from '../common/ResponsiveText';
import { dimensions } from '../../utils/responsive';

interface ResponsiveAuthInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: string;
  error?: string;
  isPassword?: boolean;
  isRequired?: boolean;
  containerStyle?: ViewStyle;
}

export const ResponsiveAuthInput: React.FC<ResponsiveAuthInputProps> = ({
  label,
  icon,
  error,
  isPassword = false,
  isRequired = false,
  containerStyle,
  ...props
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const { moderateScale, responsiveFontSize } = useResponsive();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
    borderRadius: dimensions.borderRadius.medium,
    paddingHorizontal: dimensions.padding.medium,
    minHeight: moderateScale(56),
    borderWidth: 1,
    borderColor: error 
      ? currentTheme.colors.error 
      : isFocused 
        ? currentTheme.colors.primary 
        : 'transparent',
  };

  return (
    <View style={[{ marginBottom: dimensions.margin.medium }, containerStyle]}>
      {label && (
        <View style={{ 
          flexDirection: 'row', 
          marginBottom: moderateScale(8),
          alignItems: 'center'
        }}>
          <ResponsiveText 
            variant="caption" 
            weight="medium"
            color={isDark ? '#e5e5e5' : '#374151'}
          >
            {label}
          </ResponsiveText>
          {isRequired && (
            <ResponsiveText 
              variant="caption" 
              color={currentTheme.colors.error}
              style={{ marginLeft: moderateScale(4) }}
            >
              *
            </ResponsiveText>
          )}
        </View>
      )}

      <View style={inputStyle}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={moderateScale(20)}
            color={isFocused ? currentTheme.colors.primary : (isDark ? '#8a8a8a' : '#9ca3af')}
            style={{ marginRight: dimensions.margin.small }}
          />
        )}

        <TextInput
          style={{
            flex: 1,
            fontSize: responsiveFontSize(16),
            color: isDark ? '#ffffff' : '#1a1a1a',
            paddingVertical: Platform.OS === 'ios' ? moderateScale(16) : moderateScale(12),
          }}
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ padding: moderateScale(8) }}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={moderateScale(20)}
              color={isDark ? '#8a8a8a' : '#9ca3af'}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginTop: moderateScale(4)
        }}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={moderateScale(14)}
            color={currentTheme.colors.error}
            style={{ marginRight: moderateScale(4) }}
          />
          <ResponsiveText
            variant="small"
            color={currentTheme.colors.error}
          >
            {error}
          </ResponsiveText>
        </View>
      )}
    </View>
  );
};