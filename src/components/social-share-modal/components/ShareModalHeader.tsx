import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { ShareModalHeaderProps } from '../types';

export const ShareModalHeader: React.FC<ShareModalHeaderProps> = ({
  onClose,
  onShare,
  canShare,
  isSharing,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[
      tw`flex-row items-center justify-between p-4 border-b`,
      { borderBottomColor: currentTheme.colors.border }
    ]}>
      <TouchableOpacity onPress={onClose}>
        <Text style={[
          tw`text-lg font-medium`,
          { color: currentTheme.colors.primary }
        ]}>
          {t('common.cancel', 'Annuler')}
        </Text>
      </TouchableOpacity>
      
      <Text style={[
        tw`text-sm font-medium`,
        { color: currentTheme.colors.text }
      ]}>
        📤 {t('socialShare.share', 'Partager')}
      </Text>
      
      <TouchableOpacity 
        onPress={onShare}
        disabled={!canShare || isSharing}
        style={[
          tw`px-4 py-2 rounded-lg`,
          {
            backgroundColor: canShare && !isSharing 
              ? currentTheme.colors.primary 
              : currentTheme.colors.border,
            opacity: canShare && !isSharing ? 1 : 0.5
          }
        ]}
      >
        <Text style={[
          tw`font-bold`,
          { color: canShare && !isSharing ? '#ffffff' : currentTheme.colors.textSecondary }
        ]}>
          {isSharing ? '⏳' : t('socialShare.share', 'Partager')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 