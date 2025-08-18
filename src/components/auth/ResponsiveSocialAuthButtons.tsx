import React from 'react';
import { View, Platform } from 'react-native';
import { ResponsiveAuthButton } from './ResponsiveAuthButton';
import { ResponsiveText } from '../common/ResponsiveText';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { dimensions } from '../../utils/responsive';

interface ResponsiveSocialAuthButtonsProps {
  onSocialLogin: (provider: 'google' | 'apple') => void;
  isLoading?: boolean;
}

export const ResponsiveSocialAuthButtons: React.FC<ResponsiveSocialAuthButtonsProps> = ({
  onSocialLogin,
  isLoading = false,
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const { moderateScale } = useResponsive();

  return (
    <View>
      {/* Divider */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: dimensions.margin.large,
      }}>
        <View style={{
          flex: 1,
          height: 1,
          backgroundColor: isDark ? '#3a3a3a' : '#e5e7eb',
        }} />
        <ResponsiveText
          variant="caption"
          color={isDark ? '#8a8a8a' : '#6b7280'}
          style={{
            paddingHorizontal: dimensions.padding.medium,
          }}
        >
          ou continuer avec
        </ResponsiveText>
        <View style={{
          flex: 1,
          height: 1,
          backgroundColor: isDark ? '#3a3a3a' : '#e5e7eb',
        }} />
      </View>

      {/* Social buttons */}
      <View style={{ gap: moderateScale(12) }}>
        <ResponsiveAuthButton
          title="Continuer avec Google"
          onPress={() => onSocialLogin('google')}
          variant="social"
          icon="google"
          disabled={isLoading}
          fullWidth
        />

        {Platform.OS === 'ios' && (
          <ResponsiveAuthButton
            title="Continuer avec Apple"
            onPress={() => onSocialLogin('apple')}
            variant="social"
            icon="apple"
            disabled={isLoading}
            fullWidth
          />
        )}
      </View>
    </View>
  );
};