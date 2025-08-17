import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTranslation } from '../../../hooks/useTranslation';
import { ThemePreviewProps } from './types';

const ThemePreview: React.FC<ThemePreviewProps> = ({ colors, currentTheme }) => {
  const { t } = useTranslation();
  
  return (
    <View style={[
      tw`p-4 mb-4 rounded-xl border`,
      { 
        backgroundColor: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border
      }
    ]}>
      <View style={tw`flex-row items-center mb-3`}>
        <MaterialCommunityIcons 
          name="eye" 
          size={20} 
          color={currentTheme.colors.primary} 
          style={tw`mr-2`}
        />
        <Text style={[
          tw`text-base font-semibold`,
          { color: currentTheme.colors.text }
        ]}>
          {t('theme.creation.themePreview', 'Aperçu du Thème')}
        </Text>
      </View>
      
      <View style={[
        tw`p-3 rounded-lg`,
        { backgroundColor: colors.background }
      ]}>
        <View style={[
          tw`p-3 rounded-lg mb-2`,
          { backgroundColor: colors.surface }
        ]}>
          <Text style={[
            tw`text-sm font-semibold mb-1`,
            { color: colors.text }
          ]}>
            {t('theme.creation.previewExample', 'Exemple de Texte')}
          </Text>
          <Text style={[
            tw`text-xs mb-2`,
            { color: colors.textSecondary }
          ]}>
            {t('theme.creation.previewSecondary', 'Texte secondaire avec votre nouveau thème')}
          </Text>
          <View style={tw`flex-row gap-2`}>
            <View style={[
              tw`px-3 py-1 rounded-full`,
              { backgroundColor: colors.primary }
            ]}>
              <Text style={[tw`text-xs font-medium`, { color: '#ffffff' }]}>
                {t('theme.creation.previewPrimary', 'Primaire')}
              </Text>
            </View>
            <View style={[
              tw`px-3 py-1 rounded-full`,
              { backgroundColor: colors.secondary }
            ]}>
              <Text style={[tw`text-xs font-medium`, { color: '#ffffff' }]}>
                {t('theme.creation.previewSecondaryBtn', 'Secondaire')}
              </Text>
            </View>
            <View style={[
              tw`px-3 py-1 rounded-full`,
              { backgroundColor: colors.accent }
            ]}>
              <Text style={[tw`text-xs font-medium`, { color: '#ffffff' }]}>
                {t('theme.creation.previewAccent', 'Accent')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ThemePreview; 