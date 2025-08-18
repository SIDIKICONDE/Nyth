import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { useTranslation } from '../../../hooks/useTranslation';
import { useTheme } from '../../../contexts/ThemeContext';

interface RegisterFooterProps {
  onNavigateToLogin: () => void;
}

export default function RegisterFooter({ onNavigateToLogin }: RegisterFooterProps) {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  return (
    <View style={tw`flex-row justify-center items-center`}>
      <Text style={[
        tw`text-sm`,
        { color: currentTheme.colors.text + '80' }
      ]}>
        {t('auth.register.haveAccount')}
      </Text>
      <TouchableOpacity 
        onPress={onNavigateToLogin}
        activeOpacity={0.7}
        style={tw`ml-1`}
      >
        <Text style={[
          tw`text-sm font-bold`,
          { color: currentTheme.colors.primary }
        ]}>
          {t('auth.register.signIn')}
        </Text>
      </TouchableOpacity>
    </View>
  );
} 