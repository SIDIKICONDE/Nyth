import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from 'twrnc';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useTranslation } from '../../../../hooks/useTranslation';

interface SecurityActionsProps {
  onMigrateKeys: () => void;
}

export const SecurityActions: React.FC<SecurityActionsProps> = ({ onMigrateKeys }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Animated.View 
      entering={FadeInDown.delay(300).springify()}
      style={tw`mt-3`}
    >
      {/* Bouton de migration simplifié */}
      <TouchableOpacity
        onPress={onMigrateKeys}
        activeOpacity={0.7}
        style={[
          tw`p-4 rounded-xl flex-row items-center justify-center mb-3`,
          { backgroundColor: currentTheme.colors.primary }
        ]}
      >
        <MaterialCommunityIcons
          name="transfer"
          size={20}
          color="white"
        />
        <Text style={tw`ml-2 text-white font-bold`}>
          {t('security.migrate.button', 'Migrer les clés existantes')}
        </Text>
      </TouchableOpacity>

      {/* Info card avec style moderne */}
      <View style={[
        tw`p-4 rounded-xl flex-row`,
        { 
          backgroundColor: currentTheme.colors.surface,
          borderWidth: 1,
          borderColor: `${currentTheme.colors.primary}20`,
        }
      ]}>
        <MaterialCommunityIcons
          name="information"
          size={20}
          color={currentTheme.colors.primary}
          style={tw`mt-0.5`}
        />
        <View style={tw`ml-3 flex-1`}>
          <Text style={[tw`text-xs leading-5`, { color: currentTheme.colors.text }]}>
            {t('security.info', 'Les clés sont chiffrées avec AES-256 et stockées dans le Keychain sécurisé.')}
          </Text>
          <Text style={[tw`text-xs mt-1`, { color: currentTheme.colors.textSecondary }]}>
            {t('security.infoExpiry', 'Expiration automatique après 90 jours')}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}; 