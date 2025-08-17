import * as React from 'react';
import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';

interface CollapsibleProps {
  title: string;
  icon?: string;
  isDefaultOpen?: boolean;
  selectedValue?: string | null;
  selectedLabel?: string;
  helpMessage?: string;
  children: React.ReactNode;
  style?: any;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  icon = '',
  isDefaultOpen = false,
  selectedValue,
  selectedLabel,
  helpMessage,
  children,
  style
}) => {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  const toggleCollapse = () => {
    setIsOpen(!isOpen);
  };

  return (
    <View style={[tw`mb-4`, style]}>
      {/* Bouton toggle */}
      <TouchableOpacity
        onPress={toggleCollapse}
        style={[
          tw`flex-row items-center justify-between px-3 py-2 rounded-lg`,
          {
            backgroundColor: isOpen ? currentTheme.colors.accent : currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: isOpen ? currentTheme.colors.accent : currentTheme.colors.border,
          }
        ]}
      >
        <View style={tw`flex-row items-center gap-2`}>
          <Text style={[
            tw`text-sm font-medium`,
            { color: isOpen ? '#ffffff' : currentTheme.colors.text }
          ]}>
            {icon} {title}
          </Text>
          <Text style={[
            tw`text-sm font-bold`,
            { color: isOpen ? '#ffffff' : currentTheme.colors.textSecondary }
          ]}>
            {isOpen ? '▼' : '▶'}
          </Text>
        </View>
        
        {/* Badge de sélection quand fermé */}
        {!isOpen && selectedValue && selectedLabel && (
          <Text style={[
            tw`text-xs px-2 py-0.5 rounded`,
            { 
              color: currentTheme.colors.accent,
              backgroundColor: currentTheme.colors.background,
            }
          ]}>
            {selectedLabel}
          </Text>
        )}
      </TouchableOpacity>

      {/* Contenu collapsible */}
      {isOpen && (
        <View style={tw`mt-2`}>
          {children}
          
          {/* Message d'aide quand aucune sélection */}
          {!selectedValue && helpMessage && (
            <View style={[
              tw`mt-2 p-2 rounded-lg`,
              { backgroundColor: currentTheme.colors.surface }
            ]}>
              <Text style={[
                tw`text-xs text-center`,
                { color: currentTheme.colors.textSecondary }
              ]}>
                {helpMessage}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}; 