import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';

interface InputFieldProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> {
  label: string;
  value: string | undefined;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: string;
  multiline?: boolean;
  maxLength?: number;
  style?: any;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline = false,
  keyboardType = 'default',
  maxLength,
  style = {},
  ...textInputProps
}) => {
  const { currentTheme } = useTheme();
  const isFocused = React.useRef(false);
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[tw`mb-6`, style]}>
      <View style={tw`flex-row items-center mb-3`}>
        <LinearGradient
          colors={[currentTheme.colors.primary + '20', currentTheme.colors.primary + '10']}
          style={tw`p-2 rounded-xl mr-3`}
        >
          <MaterialCommunityIcons 
            name={icon as any} 
            size={18} 
            color={currentTheme.colors.primary} 
          />
        </LinearGradient>
        <Text style={[tw`text-base font-bold flex-1`, { color: currentTheme.colors.text }]}>
          {label}
        </Text>
        {maxLength && (
          <View style={[
            tw`px-2 py-1 rounded-full`,
            { backgroundColor: currentTheme.colors.primary + '10' }
          ]}>
            <Text style={[tw`text-xs font-medium`, { color: currentTheme.colors.primary }]}>
              {(value || '')?.length || 0}/{maxLength}
            </Text>
          </View>
        )}
      </View>
      <View style={[
        tw`rounded-2xl overflow-hidden`,
        { 
          backgroundColor: currentTheme.colors.background,
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? currentTheme.colors.primary : currentTheme.colors.border + '40',
        }
      ]}>
        <TextInput
          value={value || ''}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            tw`px-5 py-4 text-base font-medium`,
            { 
              color: currentTheme.colors.text,
              minHeight: multiline ? 120 : 56,
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.colors.textSecondary + '60'}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType}
          maxLength={maxLength}
          {...textInputProps}
        />
      </View>
    </View>
  );
}; 