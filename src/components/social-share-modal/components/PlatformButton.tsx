import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { PlatformButtonProps } from '../types';

export const PlatformButton: React.FC<PlatformButtonProps> = ({
  platform,
  isSelected,
  isInstalled,
  isRecommended,
  onSelect,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => onSelect(platform)}
      style={[
        tw`p-2 rounded-lg mb-2 border`,
        {
          backgroundColor: isSelected 
            ? platform.color + '15' 
            : currentTheme.colors.surface,
          borderColor: isSelected 
            ? platform.color 
            : currentTheme.colors.border,
        }
      ]}
    >
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center flex-1`}>
          <Text style={tw`text-xl mr-2`}>{platform.icon}</Text>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center`}>
              <Text style={[
                tw`text-base font-semibold`,
                { color: isSelected ? platform.color : currentTheme.colors.text }
              ]}>
                {platform.name}
              </Text>
              {isRecommended && (
                <View style={[
                  tw`ml-1 px-1 py-0.5 rounded`,
                  { backgroundColor: currentTheme.colors.success + '20' }
                ]}>
                  <Text style={[
                    tw`text-xs font-medium`,
                    { color: currentTheme.colors.success }
                  ]}>
                    ⭐
                  </Text>
                </View>
              )}
            </View>
            <Text style={[
              tw`text-xs`,
              { color: currentTheme.colors.textSecondary }
            ]}>
              {platform.recommendedFormat.quality} • {platform.recommendedFormat.aspectRatio.width}:{platform.recommendedFormat.aspectRatio.height}
            </Text>
          </View>
        </View>
        
        <View style={tw`ml-2`}>
          {isInstalled ? (
            <Text style={[
              tw`text-xs font-medium`,
              { color: currentTheme.colors.success }
            ]}>
              ✓ {t('socialShare.status.installed', 'INSTALLÉ')}
            </Text>
          ) : (
            <Text style={[
              tw`text-xs font-medium`,
              { color: currentTheme.colors.warning }
            ]}>
              ○ {t('socialShare.status.notInstalled', 'NON INSTALLÉ')}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}; 