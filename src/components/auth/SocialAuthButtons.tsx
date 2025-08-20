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

  return (
    <View style={tw`mt-6 w-full max-w-sm mx-auto`}>
      {/* Séparateur avec texte */}
      <View style={tw`flex-row items-center mb-4`}>
        <View style={[
          tw`flex-1 h-px`,
          { backgroundColor: isDark ? '#404040' : '#e5e7eb' }
        ]} />
        <Text style={[
          tw`mx-4 text-center text-sm`,
          { color: isDark ? '#8a8a8a' : '#6b7280' }
        ]}>
          Ou continuer avec
        </Text>
        <View style={[
          tw`flex-1 h-px`,
          { backgroundColor: isDark ? '#404040' : '#e5e7eb' }
        ]} />
      </View>

      {/* Boutons d'authentification sociale */}
      <View style={tw`flex-row justify-center gap-4`}>
        {socialProviders.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            onPress={() => onSocialLogin(provider.id)}
            disabled={isLoading}
            style={[
              tw`w-14 h-14 rounded-full items-center justify-center border-2`,
              {
                backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                borderColor: isDark ? '#404040' : '#e5e7eb',
                opacity: isLoading ? 0.6 : 1,
                shadowColor: isDark ? '#000000' : '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={provider.icon}
              size={24}
              color={isDark && provider.id === 'apple' ? '#ffffff' : provider.color}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
