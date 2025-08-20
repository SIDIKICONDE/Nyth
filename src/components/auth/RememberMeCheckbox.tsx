import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

interface RememberMeCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
}

export const RememberMeCheckbox: React.FC<RememberMeCheckboxProps> = ({
  checked,
  onToggle,
  label = 'Se souvenir de moi',
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;

  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const checkboxSize = responsiveSpacing(20);
  const fontSize = responsiveFontSize(14);

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={tw`flex-row items-center mb-4`}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View
        style={[
          tw`rounded border-2 items-center justify-center mr-3`,
          {
            width: checkboxSize,
            height: checkboxSize,
            borderColor: checked ? currentTheme.colors.primary : (isDark ? '#404040' : '#d1d5db'),
            backgroundColor: checked ? currentTheme.colors.primary : 'transparent',
          },
        ]}
      >
        {checked && (
          <MaterialCommunityIcons
            name="check"
            size={14}
            color="#ffffff"
          />
        )}
      </View>

      <Text
        style={[
          tw`flex-1`,
          {
            color: textColor,
            fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
