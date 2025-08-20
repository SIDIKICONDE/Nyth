import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';

export const ShareTips: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[
      tw`p-2 rounded`,
      {
        backgroundColor: currentTheme.colors.primary + '10',
        borderWidth: 1,
        borderColor: currentTheme.colors.primary + '30'
      }
    ]}>
      <Text style={[
        tw`text-xs font-semibold mb-1`,
        { color: currentTheme.colors.primary }
      ]}>
        💡 {t('socialShare.tips.title', 'Conseils')}
      </Text>
      <Text style={[
        tw`text-xs`,
        { color: currentTheme.colors.text }
      ]}>
        • {t('socialShare.tips.videoSaved', 'Vidéo sauvée dans galerie')}{'\n'}
        • {t('socialShare.tips.appOpens', 'App s\'ouvre automatiquement')}{'\n'}
        • {t('socialShare.tips.followInstructions', 'Suivez les instructions')}
      </Text>
    </View>
  );
}; 