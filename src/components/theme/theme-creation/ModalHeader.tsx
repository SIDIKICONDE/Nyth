import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTranslation } from '../../../hooks/useTranslation';
import { CustomTheme } from '../../../contexts/ThemeContext';

interface ModalHeaderProps {
  currentTheme: CustomTheme;
  onClose: () => void;
  onCreateTheme: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  currentTheme,
  onClose,
  onCreateTheme
}) => {
  const { t } = useTranslation();

  return (
    <View style={[
      tw`px-5 py-4 flex-row items-center justify-between`,
      { 
        backgroundColor: currentTheme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: currentTheme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3
      }
    ]}>
      {/* Icône à gauche */}
      <View style={[
        tw`w-10 h-10 rounded-full items-center justify-center`,
        { backgroundColor: `${currentTheme.colors.primary}15` }
      ]}>
        <MaterialCommunityIcons 
          name="palette" 
          size={22} 
          color={currentTheme.colors.primary} 
        />
      </View>

      {/* Boutons d'action à droite */}
      <View style={tw`flex-row items-center gap-2`}>
        <TouchableOpacity
          onPress={onClose}
          style={[
            tw`px-4 py-2 rounded-full flex-row items-center`,
            { 
              backgroundColor: currentTheme.colors.background,
              borderWidth: 1,
              borderColor: currentTheme.colors.border
            }
          ]}
        >
          <Text style={[
            tw`text-sm font-medium`,
            { color: currentTheme.colors.text }
          ]}>
            {t('theme.creation.cancel', 'Annuler')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCreateTheme}
          style={[
            tw`px-5 py-2 rounded-full flex-row items-center`,
            { 
              backgroundColor: currentTheme.colors.primary,
              shadowColor: currentTheme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3
            }
          ]}
        >
          <MaterialCommunityIcons 
            name="check" 
            size={18} 
            color="#ffffff" 
            style={tw`mr-1`}
          />
          <Text style={[
            tw`text-sm font-semibold`,
            { color: '#ffffff' }
          ]}>
            {t('theme.creation.create', 'Créer')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ModalHeader; 