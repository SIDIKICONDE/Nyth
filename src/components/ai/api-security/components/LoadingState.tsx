import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useTranslation } from '../../../../hooks/useTranslation';

export const LoadingState: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={tw`p-4 items-center justify-center`}>
      <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      <Text style={[tw`mt-2 text-sm`, { color: currentTheme.colors.textSecondary }]}>
        {t('security.loading', 'Vérification de la sécurité...')}
      </Text>
    </View>
  );
}; 