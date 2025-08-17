import React from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { CustomTheme } from '../../../contexts/ThemeContext';
import { AIFriendlyIcon } from '../../../components/icons';

interface SettingsButtonProps {
  currentTheme: CustomTheme;
  onNavigateToSettings: () => void;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ currentTheme, onNavigateToSettings }) => {
  const navigation = useNavigation();

  return (
    <View style={tw`flex-row items-center`}>
      <Pressable
        onPress={() => navigation.navigate('AIChat' as never)}
        style={({ pressed }) => [
          tw`mr-2 rounded-full overflow-hidden`,
          { opacity: pressed ? 0.7 : 1 }
        ]}
      >
        <View style={tw`flex-row items-center justify-center p-2`}>
          <AIFriendlyIcon 
            size={32} 
            primaryColor={currentTheme.colors.accent}
            secondaryColor={currentTheme.colors.primary}
            animated={true}
          />
        </View>
      </Pressable>

      <Pressable
        onPress={onNavigateToSettings}
        style={({ pressed }) => [
          tw`rounded-full overflow-hidden`,
          { opacity: pressed ? 0.7 : 1 }
        ]}
      >
        <View style={tw`flex-row items-center justify-center p-2`}>
          <MaterialCommunityIcons 
            name="cog" 
            size={24} 
            color={currentTheme.colors.accent} 
          />
        </View>
      </Pressable>
    </View>
  );
}; 