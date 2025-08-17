import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { FormFieldProps } from "../types";

export default function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  secureTextEntry = false,
  isPasswordVisible,
  onTogglePasswordVisibility,
  keyboardType = "default",
  autoCapitalize = "sentences",
  iconName,
}: FormFieldProps) {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme.isDark;
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View style={tw`mb-3`}>
      <Animated.View entering={FadeInUp.duration(300)}>
        {label && (
          <Text
            style={[
              tw`text-sm font-medium mb-1.5 ml-1`,
              { color: currentTheme.colors.text },
            ]}
          >
            {label}
          </Text>
        )}

        <View
          style={[
            tw`rounded-xl`,
            {
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.95)",
              borderWidth: 1.5,
              borderColor: error
                ? currentTheme.colors.error
                : isFocused
                ? currentTheme.colors.primary
                : isDarkMode
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.08)",
              minHeight: 50, // Hauteur réduite
            },
          ]}
        >
          <View style={tw`flex-row items-center px-3 py-3`}>
            <View
              style={[
                tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                {
                  backgroundColor: `${currentTheme.colors.primary}15`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={iconName as any}
                size={18}
                color={currentTheme.colors.primary}
              />
            </View>

            <TextInput
              style={[
                tw`flex-1 text-sm font-medium`,
                {
                  color: currentTheme.colors.text,
                  minHeight: 24, // Hauteur réduite
                },
              ]}
              placeholder={placeholder}
              placeholderTextColor={currentTheme.colors.text + "60"}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              secureTextEntry={secureTextEntry && !isPasswordVisible}
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="done"
              blurOnSubmit={true}
            />

            {secureTextEntry && onTogglePasswordVisibility && (
              <TouchableOpacity
                style={tw`p-1`}
                onPress={onTogglePasswordVisibility}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={currentTheme.colors.text + "80"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Container pour les erreurs avec hauteur réduite */}
        <View style={[tw`ml-3 mt-1`, { minHeight: 12 }]}>
          {error ? (
            <Text
              style={[
                tw`text-xs leading-3`,
                {
                  color: currentTheme.colors.error,
                },
              ]}
            >
              {error}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
