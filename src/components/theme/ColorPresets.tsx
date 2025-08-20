import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';

interface ColorPresetsProps {
  currentColors: ThemeColors;
  onColorChange: (colors: Partial<ThemeColors>) => void;
  isDarkMode: boolean;
}

interface ColorPreset {
  name: string;
  emoji: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    light: {
      background: string;
      surface: string;
      text: string;
    };
    dark: {
      background: string;
      surface: string;
      text: string;
    };
  };
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'ocean',
    emoji: '🌊',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#0891b2',
      light: {
        background: '#f0f9ff',
        surface: '#ffffff',
        text: '#0c4a6e',
      },
      dark: {
        background: '#0c1629',
        surface: '#1e293b',
        text: '#e2e8f0',
      }
    }
  },
  {
    name: 'violet',
    emoji: '🌌',
    colors: {
      primary: '#a855f7',
      secondary: '#9333ea',
      accent: '#7c3aed',
      light: {
        background: '#faf5ff',
        surface: '#ffffff',
        text: '#581c87',
      },
      dark: {
        background: '#1a0b2e',
        surface: '#2d1b47',
        text: '#f3e8ff',
      }
    }
  },
  {
    name: 'rose',
    emoji: '💖',
    colors: {
      primary: '#ec4899',
      secondary: '#db2777',
      accent: '#be185d',
      light: {
        background: '#fdf2f8',
        surface: '#ffffff',
        text: '#831843',
      },
      dark: {
        background: '#18020c',
        surface: '#3f0d2b',
        text: '#fbcfe8',
      }
    }
  },
  {
    name: 'turquoise',
    emoji: '🐚',
    colors: {
      primary: '#14b8a6',
      secondary: '#0d9488',
      accent: '#0f766e',
      light: {
        background: '#f0fdfa',
        surface: '#ffffff',
        text: '#134e4a',
      },
      dark: {
        background: '#042f2e',
        surface: '#134e4a',
        text: '#ccfbf1',
      }
    }
  },
  {
    name: 'emerald',
    emoji: '💎',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#047857',
      light: {
        background: '#ecfdf5',
        surface: '#ffffff',
        text: '#064e3b',
      },
      dark: {
        background: '#022c22',
        surface: '#064e3b',
        text: '#d1fae5',
      }
    }
  },
  {
    name: 'orange',
    emoji: '🔥',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#c2410c',
      light: {
        background: '#fff7ed',
        surface: '#ffffff',
        text: '#9a3412',
      },
      dark: {
        background: '#1a0f0a',
        surface: '#431407',
        text: '#fed7aa',
      }
    }
  }
];

const ColorPresets: React.FC<ColorPresetsProps> = ({
  currentColors,
  onColorChange,
  isDarkMode
}) => {
  const { t } = useTranslation();
  const handlePresetSelect = (preset: ColorPreset) => {
    const themeColors = isDarkMode ? preset.colors.dark : preset.colors.light;
    
    onColorChange({
      primary: preset.colors.primary,
      secondary: preset.colors.secondary,
      accent: preset.colors.accent,
      background: themeColors.background,
      surface: themeColors.surface,
      text: themeColors.text,
    });
  };

  return (
    <View style={[
      tw`p-3 mb-4 rounded-xl`,
      { backgroundColor: currentColors.surface }
    ]}>
      <Text style={[
        tw`text-sm font-semibold mb-2`,
        { color: currentColors.text }
      ]}>
        {t('theme.presets.title')}
      </Text>
      
      <View style={tw`flex-row flex-wrap justify-between`}>
        {COLOR_PRESETS.map((preset, index) => {
          const isSelected = currentColors.primary === preset.colors.primary;
          const themeColors = isDarkMode ? preset.colors.dark : preset.colors.light;
          
          return (
            <TouchableOpacity
              key={index}
              style={tw`mb-2 w-[48%]`}
              onPress={() => handlePresetSelect(preset)}
            >
              <View style={[
                tw`flex-row items-center p-2 rounded-lg`,
                { 
                  backgroundColor: themeColors.background,
                  borderWidth: 2,
                  borderColor: isSelected ? preset.colors.primary : 'transparent'
                }
              ]}>
                <View 
                  style={[
                    tw`w-4 h-4 rounded-full mr-1.5`, 
                    { backgroundColor: preset.colors.primary }
                  ]} 
                />
                <Text style={[
                  tw`text-xs font-medium flex-shrink`,
                  { color: themeColors.text }
                ]}>
                  {preset.emoji} {t(`theme.presets.${preset.name}`, preset.name)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default ColorPresets; 