import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';

export const ModalHeader: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <View style={tw`items-center pt-2 pb-3`}>
      <View style={[
        tw`w-12 h-1 rounded-full`,
        { backgroundColor: currentTheme.colors.border }
      ]} />
    </View>
  );
}; 