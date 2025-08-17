import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { useAndroidThemeSync } from '../../utils/androidThemeSync';
import { useTranslation } from '../../hooks/useTranslation';
import Card from '../settings/Card';

interface AndroidThemePreviewProps {
  visible?: boolean;
  onClose?: () => void;
}

const AndroidThemePreview: React.FC<AndroidThemePreviewProps> = ({
  visible = true,
  onClose
}) => {
  const { currentTheme } = useTheme();
  const { getStyleName, generateColorsXml } = useAndroidThemeSync();
  const { t } = useTranslation();
  const [showXmlCode, setShowXmlCode] = useState(false);

  if (!visible || Platform.OS !== 'android') {
    return null;
  }

  const androidStyleName = getStyleName(currentTheme);
  const xmlCode = generateColorsXml(currentTheme);

  const renderColorSwatch = (label: string, color: string, description?: string) => (
    <View style={tw`mb-3`}>
      <View style={tw`flex-row items-center mb-1`}>
        <View 
          style={[
            tw`w-6 h-6 rounded-lg mr-3 border`,
            { 
              backgroundColor: color,
              borderColor: currentTheme.colors.border
            }
          ]} 
        />
        <View style={tw`flex-1`}>
          <Text style={[
            tw`text-sm font-semibold`,
            { color: currentTheme.colors.text }
          ]}>
            {label}
          </Text>
          <Text style={[
            tw`text-xs`,
            { color: currentTheme.colors.textSecondary }
          ]}>
            {color}
          </Text>
          {description && (
            <Text style={[
              tw`text-xs italic`,
              { color: currentTheme.colors.textMuted }
            ]}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={[
        tw`flex-1 p-4`,
        { backgroundColor: currentTheme.colors.background }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View style={tw`flex-row items-center flex-1`}>
          <MaterialCommunityIcons 
            name="android" 
            size={24} 
            color={currentTheme.colors.primary} 
            style={tw`mr-2`}
          />
          <View style={tw`flex-1`}>
            <Text style={[
              tw`text-lg font-bold`,
              { color: currentTheme.colors.text }
            ]}>
              Aperçu Android
            </Text>
            <Text style={[
              tw`text-sm`,
              { color: currentTheme.colors.textSecondary }
            ]}>
              Thème: {currentTheme.name}
            </Text>
          </View>
        </View>
        
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={[
              tw`p-2 rounded-lg`,
              { backgroundColor: currentTheme.colors.surface }
            ]}
          >
            <MaterialCommunityIcons 
              name="close" 
              size={20} 
              color={currentTheme.colors.text} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Informations du style Android */}
      <Card style={tw`mb-4`}>
        <View style={tw`flex-row items-center mb-2`}>
          <MaterialCommunityIcons 
            name="palette" 
            size={20} 
            color={currentTheme.colors.primary} 
            style={tw`mr-2`}
          />
          <Text style={[
            tw`text-base font-semibold`,
            { color: currentTheme.colors.text }
          ]}>
            Style Android Appliqué
          </Text>
        </View>
        
        <View style={[
          tw`p-3 rounded-lg`,
          { backgroundColor: currentTheme.colors.surface }
        ]}>
          <Text style={[
            tw`text-sm font-mono`,
            { color: currentTheme.colors.accent }
          ]}>
            {androidStyleName}
          </Text>
        </View>
        
        <Text style={[
          tw`text-xs mt-2`,
          { color: currentTheme.colors.textMuted }
        ]}>
          Ce style sera automatiquement appliqué aux composants natifs Android
        </Text>
      </Card>

      {/* Palette de couleurs */}
      <Card style={tw`mb-4`}>
        <View style={tw`flex-row items-center mb-3`}>
          <MaterialCommunityIcons 
            name="format-color-fill" 
            size={20} 
            color={currentTheme.colors.primary} 
            style={tw`mr-2`}
          />
          <Text style={[
            tw`text-base font-semibold`,
            { color: currentTheme.colors.text }
          ]}>
            Couleurs Synchronisées
          </Text>
        </View>

        {renderColorSwatch(
          'Couleur Principale', 
          currentTheme.colors.primary,
          'Boutons, liens, éléments interactifs'
        )}
        
        {renderColorSwatch(
          'Couleur Secondaire', 
          currentTheme.colors.secondary,
          'Éléments d\'accent, status bar'
        )}
        
        {renderColorSwatch(
          'Arrière-plan', 
          currentTheme.colors.background,
          'Fond principal de l\'application'
        )}
        
        {renderColorSwatch(
          'Surface', 
          currentTheme.colors.surface,
          'Cartes, modales, overlays'
        )}
        
        {renderColorSwatch(
          'Texte Principal', 
          currentTheme.colors.text,
          'Titres, texte principal'
        )}
        
        {renderColorSwatch(
          'Texte Secondaire', 
          currentTheme.colors.textSecondary,
          'Sous-titres, descriptions'
        )}
      </Card>

      {/* Améliorations Android */}
      <Card style={tw`mb-4`}>
        <View style={tw`flex-row items-center mb-3`}>
          <MaterialCommunityIcons 
            name="star" 
            size={20} 
            color={currentTheme.colors.success} 
            style={tw`mr-2`}
          />
          <Text style={[
            tw`text-base font-semibold`,
            { color: currentTheme.colors.text }
          ]}>
            Améliorations Android
          </Text>
        </View>

                    <View style={tw`gap-2`}>
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={16} 
              color={currentTheme.colors.success} 
              style={tw`mr-2`}
            />
            <Text style={[
              tw`text-sm flex-1`,
              { color: currentTheme.colors.text }
            ]}>
              Status bar adaptative selon le thème
            </Text>
          </View>
          
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={16} 
              color={currentTheme.colors.success} 
              style={tw`mr-2`}
            />
            <Text style={[
              tw`text-sm flex-1`,
              { color: currentTheme.colors.text }
            ]}>
              Couleurs système Material Design 3
            </Text>
          </View>
          
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={16} 
              color={currentTheme.colors.success} 
              style={tw`mr-2`}
            />
            <Text style={[
              tw`text-sm flex-1`,
              { color: currentTheme.colors.text }
            ]}>
              Support automatique mode sombre/clair
            </Text>
          </View>
          
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={16} 
              color={currentTheme.colors.success} 
              style={tw`mr-2`}
            />
            <Text style={[
              tw`text-sm flex-1`,
              { color: currentTheme.colors.text }
            ]}>
              Thèmes spéciaux pour RGB+, Cyberpunk, Liquid Glass
            </Text>
          </View>
        </View>
      </Card>

      {/* Code XML (optionnel) */}
      <Card style={tw`mb-6`}>
        <TouchableOpacity
          onPress={() => setShowXmlCode(!showXmlCode)}
          style={tw`flex-row items-center justify-between mb-3`}
        >
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons 
              name="code-tags" 
              size={20} 
              color={currentTheme.colors.primary} 
              style={tw`mr-2`}
            />
            <Text style={[
              tw`text-base font-semibold`,
              { color: currentTheme.colors.text }
            ]}>
              Code XML Généré
            </Text>
          </View>
          
          <MaterialCommunityIcons 
            name={showXmlCode ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={currentTheme.colors.textSecondary} 
          />
        </TouchableOpacity>

        {showXmlCode && (
          <ScrollView 
            horizontal
            style={[
              tw`p-3 rounded-lg`,
              { backgroundColor: currentTheme.colors.background }
            ]}
          >
            <Text style={[
              tw`text-xs font-mono`,
              { color: currentTheme.colors.textSecondary }
            ]}>
              {xmlCode}
            </Text>
          </ScrollView>
        )}
      </Card>
    </ScrollView>
  );
};

export default AndroidThemePreview; 