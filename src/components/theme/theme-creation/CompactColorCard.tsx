import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTranslation } from '../../../hooks/useTranslation';
import ColorPickerAdvanced from '../../ui/ColorPickerAdvanced';
import { CompactColorCardProps } from './types';

const CompactColorCard: React.FC<CompactColorCardProps> = ({
  title,
  icon,
  color,
  onColorChange,
  currentTheme
}) => {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleColorClick = () => {
    setShowTooltip(true);
    // Masquer l'infobulle après 2 secondes
    setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  };

  return (
    <View style={[
      tw`flex-row items-center p-3 mb-2 rounded-lg border relative`,
      { 
        backgroundColor: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border
      }
    ]}>
      {/* Icône et titre */}
      <View style={tw`flex-row items-center flex-1`}>
        <View style={[
          tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
          { backgroundColor: `${color}20` }
        ]}>
          <MaterialCommunityIcons 
            name={icon as any} 
            size={18} 
            color={color} 
          />
        </View>
        <Text style={[
          tw`text-sm font-medium flex-1`,
          { color: currentTheme.colors.text }
        ]}>
          {title}
        </Text>
      </View>
      
      {/* Aperçu de couleur cliquable avec infobulle */}
      <View style={tw`flex-row items-center relative`}>
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-lg mr-3 items-center justify-center`,
            { backgroundColor: color }
          ]}
          onPress={handleColorClick}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="information-outline" 
            size={16} 
            color="rgba(255, 255, 255, 0.8)" 
          />
        </TouchableOpacity>

        {/* Infobulle */}
        {showTooltip && (
          <View style={[
            tw`absolute right-0 top-12 z-10 p-3 rounded-lg min-w-48`,
            { 
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              borderWidth: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5
            }
          ]}>
            <View style={tw`flex-row items-center mb-1`}>
              <MaterialCommunityIcons 
                name="information" 
                size={16} 
                color={currentTheme.colors.primary} 
                style={tw`mr-2`}
              />
              <Text style={[
                tw`text-xs font-semibold`,
                { color: currentTheme.colors.text }
              ]}>
                {t('theme.creation.compactModeInfo', 'Mode Compact')}
              </Text>
            </View>
            <Text style={[
              tw`text-xs`,
              { color: currentTheme.colors.textSecondary }
            ]}>
              {t('theme.creation.compactModeDescription', 'Passez en mode "Cartes" pour éditer les couleurs')}
            </Text>
            
            {/* Petite flèche vers le haut */}
            <View style={[
              tw`absolute -top-1 right-4 w-2 h-2 rotate-45`,
              { backgroundColor: currentTheme.colors.background }
            ]} />
          </View>
        )}
        
        {/* Indicateur visuel que c'est en lecture seule */}
        <View style={[
          tw`w-6 h-6 rounded-full items-center justify-center`,
          { backgroundColor: currentTheme.colors.textMuted + '20' }
        ]}>
          <MaterialCommunityIcons 
            name="eye" 
            size={12} 
            color={currentTheme.colors.textMuted} 
          />
        </View>
      </View>
    </View>
  );
};

export default CompactColorCard; 