import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { SocialAuthProvider } from '../../screens/auth/types';
import { responsiveFontSize, responsiveSpacing, isTablet } from '../../utils/responsive';

interface SocialAuthButtonsProps {
  onSocialLogin: (provider: SocialAuthProvider['id']) => void;
  isLoading?: boolean;
}

const socialProviders: SocialAuthProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'google',
    color: '#db4437',
  },
  // Apple uniquement sur iOS
  ...(
    Platform.OS === 'ios'
      ? ([{ id: 'apple', name: 'Apple', icon: 'apple', color: '#000000' }] as SocialAuthProvider[])
      : ([] as SocialAuthProvider[])
  ),
];

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onSocialLogin,
  isLoading = false,
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const isTabletDevice = isTablet();
  
  // Responsive values
  const fontSize = responsiveFontSize(14);
  const iconSize = responsiveFontSize(24);
  const buttonSize = responsiveSpacing(56);
  const gap = responsiveSpacing(16);
  const marginTop = responsiveSpacing(24);
  const marginBottom = responsiveSpacing(16);

  return (
    <View style={[tw`mt-6`, { marginTop }]}>
      <View style={[tw`flex-row items-center mb-4`, { marginBottom }]}>
        <View style={[tw`flex-1 h-px`, { backgroundColor: isDark ? '#404040' : '#e5e7eb' }]} />
        <Text style={[
          tw`mx-4`,
          { 
            color: isDark ? '#8a8a8a' : '#6b7280',
            fontSize,
            marginHorizontal: responsiveSpacing(16),
          }
        ]}>
          Ou continuer avec
        </Text>
        <View style={[tw`flex-1 h-px`, { backgroundColor: isDark ? '#404040' : '#e5e7eb' }]} />
      </View>

      <View style={[
        tw`justify-center`,
        {
          flexDirection: isTabletDevice ? 'row' : 'row',
          gap,
          alignItems: 'center',
        }
      ]}>
        {socialProviders.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            onPress={() => onSocialLogin(provider.id)}
            disabled={isLoading}
            style={[
              tw`rounded-full items-center justify-center border-2`,
              {
                width: buttonSize,
                height: buttonSize,
                backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                borderColor: isDark ? '#404040' : '#e5e7eb',
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={provider.icon}
              size={iconSize}
              color={isDark && provider.id === 'apple' ? '#ffffff' : provider.color}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
