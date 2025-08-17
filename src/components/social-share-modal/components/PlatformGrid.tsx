import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { useInstalledApps } from '../../../hooks/useInstalledApps';
import { PlatformGridProps } from '../types';
import { PlatformButton } from './PlatformButton';

export const PlatformGrid: React.FC<PlatformGridProps> = ({
  platforms,
  selectedPlatform,
  onPlatformSelect,
  recommendedPlatforms,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { isAppInstalled } = useInstalledApps();

  if (selectedPlatform) {
    return (
      <View style={tw`mb-4`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={[
            tw`text-base font-semibold`,
            { color: currentTheme.colors.text }
          ]}>
            📱 {t('socialShare.selectedPlatform', 'Plateforme sélectionnée')}
          </Text>
          <TouchableOpacity
            onPress={() => onPlatformSelect(null)}
            style={[
              tw`px-2 py-1 rounded`,
              { backgroundColor: currentTheme.colors.primary + '20' }
            ]}
          >
            <Text style={[
              tw`text-xs font-medium`,
              { color: currentTheme.colors.primary }
            ]}>
              {t('socialShare.change', 'Changer')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <PlatformButton 
          platform={selectedPlatform}
          isSelected={true}
          isInstalled={isAppInstalled(selectedPlatform.id)}
          isRecommended={recommendedPlatforms.some(p => p.id === selectedPlatform.id)}
          onSelect={() => {}} // Pas de sélection possible quand déjà sélectionné
        />
      </View>
    );
  }

  return (
    <View style={tw`mb-4`}>
      <Text style={[
        tw`text-base font-semibold mb-2`,
        { color: currentTheme.colors.text }
      ]}>
        🎯 {t('socialShare.choosePlatform', 'Choisir une plateforme')}
      </Text>
      
      {platforms.map((platform) => (
        <PlatformButton 
          key={platform.id}
          platform={platform}
          isSelected={false}
          isInstalled={isAppInstalled(platform.id)}
          isRecommended={recommendedPlatforms.some(p => p.id === platform.id)}
          onSelect={onPlatformSelect}
        />
      ))}
    </View>
  );
}; 