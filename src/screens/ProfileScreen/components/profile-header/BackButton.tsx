import React from 'react';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

interface BackButtonProps {
  onPress: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      tw`absolute w-12 h-12 rounded-full items-center justify-center`,
      {
        top: 50, // Position fixe plus basse pour éviter la status bar
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.3)', // Fond plus sombre pour meilleure visibilité
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        zIndex: 1000, // Z-index élevé pour s'assurer qu'il est au-dessus
      }
    ]}
    activeOpacity={0.6}
  >
    <MaterialCommunityIcons 
      name="arrow-left" 
      size={22} 
      color="white" 
    />
  </TouchableOpacity>
); 