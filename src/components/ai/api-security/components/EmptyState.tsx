import React from 'react';
import { View, Text, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from 'twrnc';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useTranslation } from '../../../../hooks/useTranslation';

export const EmptyState: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: currentTheme.colors.textSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
    },
    android: {
      elevation: 2,
    },
  });

  return (
    <Animated.View 
      entering={FadeIn}
      style={[
        tw`p-8 rounded-xl items-center mb-3`,
        { 
          backgroundColor: currentTheme.colors.surface,
          borderWidth: Platform.OS === 'android' ? 0.5 : 0,
          borderColor: Platform.OS === 'android' ? currentTheme.colors.border : 'transparent',
        },
        shadowStyle,
      ]}
    >
      <View style={[
        tw`p-4 rounded-full mb-4`,
        { backgroundColor: `${currentTheme.colors.textSecondary}10` }
      ]}>
        <MaterialCommunityIcons
          name="shield-off"
          size={48}
          color={currentTheme.colors.textSecondary}
        />
      </View>
      <Text style={[tw`text-center font-medium`, { color: currentTheme.colors.text }]}>
        {t('security.keys.none', 'Aucune clé sécurisée')}
      </Text>
      <Text style={[tw`text-center text-sm mt-1`, { color: currentTheme.colors.textSecondary }]}>
        {t('security.keys.noneDesc', 'Ajoutez des clés API pour commencer')}
      </Text>
    </Animated.View>
  );
}; 