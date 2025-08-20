import React from 'react';
import { TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';

interface ModalContentProps {
  children: React.ReactNode;
  onClose: () => void;
}

export const ModalContent: React.FC<ModalContentProps> = ({ 
  children, 
  onClose 
}) => {
  const { currentTheme } = useTheme();

  return (
    <TouchableOpacity 
      style={tw`flex-1 justify-end`}
      activeOpacity={1}
      onPress={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1}
        style={[
          tw`rounded-t-3xl`,
          { 
            backgroundColor: currentTheme.colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }
        ]}
      >
        {children}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}; 