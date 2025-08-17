import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTranslation } from '../../../hooks/useTranslation';
import { CustomTheme, ThemeColors } from '../../../contexts/ThemeContext';
import ColorCard from './ColorCard';
import CompactColorCard from './CompactColorCard';
import { ViewMode } from './types';

interface ColorCustomizationProps {
  currentTheme: CustomTheme;
  customColors: ThemeColors;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onColorChange: (colors: Partial<ThemeColors>) => void;
}

const ColorCustomization: React.FC<ColorCustomizationProps> = ({
  currentTheme,
  customColors,
  viewMode,
  onViewModeChange,
  onColorChange
}) => {
  const { t } = useTranslation();

  const colorConfigs = [
    {
      key: 'primary' as keyof ThemeColors,
      title: t('theme.creation.primaryColor', 'Couleur Primaire'),
      description: t('theme.creation.primaryDescription', 'Couleur principale de l\'interface'),
      icon: 'palette',
      color: customColors.primary
    },
    {
      key: 'secondary' as keyof ThemeColors,
      title: t('theme.creation.secondaryColor', 'Couleur Secondaire'),
      description: t('theme.creation.secondaryDescription', 'Couleur d\'accent et d\'interaction'),
      icon: 'palette-outline',
      color: customColors.secondary
    },
    {
      key: 'accent' as keyof ThemeColors,
      title: t('theme.creation.accentColor', 'Couleur d\'Accent'),
      description: t('theme.creation.accentDescription', 'Mise en valeur et éléments spéciaux'),
      icon: 'star',
      color: customColors.accent
    },
    {
      key: 'background' as keyof ThemeColors,
      title: t('theme.creation.background', 'Arrière-plan'),
      description: t('theme.creation.backgroundDescription', 'Couleur de fond principal'),
      icon: 'image-area',
      color: customColors.background
    },
    {
      key: 'surface' as keyof ThemeColors,
      title: t('theme.creation.surface', 'Surface'),
      description: t('theme.creation.surfaceDescription', 'Cartes et conteneurs élevés'),
      icon: 'card-outline',
      color: customColors.surface
    },
    {
      key: 'text' as keyof ThemeColors,
      title: t('theme.creation.mainText', 'Texte Principal'),
      description: t('theme.creation.textDescription', 'Couleur du texte principal'),
      icon: 'format-text',
      color: customColors.text
    }
  ];

  return (
    <View style={tw`mb-4`}>
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons 
            name="brush" 
            size={20} 
            color={currentTheme.colors.primary} 
            style={tw`mr-2`}
          />
          <Text style={[
            tw`text-base font-semibold`,
            { color: currentTheme.colors.text }
          ]}>
            {t('theme.creation.customColors', 'Couleurs Personnalisées')}
          </Text>
        </View>
        
        {/* Boutons de vue */}
        <View style={tw`flex-row gap-1`}>
          <TouchableOpacity
            onPress={() => onViewModeChange('cards')}
            style={[
              tw`px-3 py-1.5 rounded-lg`,
              { 
                backgroundColor: viewMode === 'cards' 
                  ? currentTheme.colors.primary 
                  : currentTheme.colors.surface,
                borderWidth: 1,
                borderColor: viewMode === 'cards'
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border
              }
            ]}
          >
            <MaterialCommunityIcons 
              name="view-agenda" 
              size={16} 
              color={viewMode === 'cards' ? '#ffffff' : currentTheme.colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onViewModeChange('compact')}
            style={[
              tw`px-3 py-1.5 rounded-lg`,
              { 
                backgroundColor: viewMode === 'compact' 
                  ? currentTheme.colors.primary 
                  : currentTheme.colors.surface,
                borderWidth: 1,
                borderColor: viewMode === 'compact'
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border
              }
            ]}
          >
            <MaterialCommunityIcons 
              name="view-list" 
              size={16} 
              color={viewMode === 'compact' ? '#ffffff' : currentTheme.colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[
        tw`text-sm mb-4`,
        { color: currentTheme.colors.textSecondary }
      ]}>
        {t('theme.creation.customizeDescription', 'Personnalisez chaque couleur pour créer votre thème unique')}
      </Text>

      {viewMode === 'cards' ? (
        colorConfigs.map((config) => (
          <ColorCard
            key={config.key}
            title={config.title}
            description={config.description}
            icon={config.icon}
            color={config.color}
            onColorChange={(color) => onColorChange({ [config.key]: color })}
            currentTheme={currentTheme}
          />
        ))
      ) : (
        colorConfigs.map((config) => (
          <CompactColorCard
            key={config.key}
            title={config.title}
            icon={config.icon}
            color={config.color}
            onColorChange={(color) => onColorChange({ [config.key]: color })}
            currentTheme={currentTheme}
          />
        ))
      )}
    </View>
  );
};

export default ColorCustomization; 