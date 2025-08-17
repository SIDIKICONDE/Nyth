import React from 'react';
import { View, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';

interface UserAvatarProps {
  photoURL?: string | null;
  size?: number;
  borderWidth?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  photoURL, 
  size = 48,
  borderWidth = 2 
}) => {
  const { currentTheme } = useTheme();
  const iconSize = size * 0.6;

  if (photoURL) {
    return (
      <Image 
        source={{ uri: photoURL }}
        style={[
          tw`rounded-full`,
          { 
            width: size,
            height: size,
            borderWidth, 
            borderColor: currentTheme.colors.primary 
          }
        ]}
      />
    );
  }

  return (
    <View style={[
      tw`rounded-full items-center justify-center`,
      { 
        width: size,
        height: size,
        backgroundColor: `${currentTheme.colors.primary}20` 
      }
    ]}>
      <MaterialCommunityIcons 
        name="account-circle" 
        size={iconSize} 
        color={currentTheme.colors.primary} 
      />
    </View>
  );
}; 