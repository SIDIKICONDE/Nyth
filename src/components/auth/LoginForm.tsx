import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";

interface LoginFormProps {
  email: string;
  password: string;
  emailError: string;
  passwordError: string;
  emailWarning?: string;
  emailSuggestions?: string[];
  isPasswordVisible: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePasswordVisibility: () => void;
  onEmailBlur: () => void;
  onPasswordBlur: () => void;
  onForgotPassword?: () => void;
  onEmailSuggestionSelect?: (suggestion: string) => void;
}

export default function LoginForm({
  email,
  password,
  emailError,
  passwordError,
  emailWarning,
  emailSuggestions = [],
  isPasswordVisible,
  onEmailChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onEmailBlur,
  onPasswordBlur,
  onForgotPassword,
  onEmailSuggestionSelect,
}: LoginFormProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const isDarkMode = currentTheme.isDark;

  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const renderInputField = (
    icon: "email-outline" | "lock-outline",
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    onBlur: () => void,
    error: string,
    isPassword?: boolean,
    fieldKey?: string
  ) => {
    const isFocused = focusedField === fieldKey;

    return (
      <View style={tw`mb-3`}>
        <Animated.View
          entering={FadeInUp.duration(500).delay(
            fieldKey === "email" ? 100 : 200
          )}
        >
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
                  name={icon}
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
                    paddingVertical: 0,
                  },
                ]}
                placeholder={placeholder}
                placeholderTextColor={currentTheme.colors.text + "60"}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setFocusedField(fieldKey || null)}
                onBlur={() => {
                  setFocusedField(null);
                  onBlur();
                }}
                keyboardType={isPassword ? "default" : "email-address"}
                autoCapitalize="none"
                secureTextEntry={isPassword && !isPasswordVisible}
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="done"
                blurOnSubmit={true}
              />

              {isPassword && (
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

          {/* Container pour les erreurs et avertissements */}
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
  };

  return (
    <View style={tw`mt-2`}>
      {renderInputField(
        "email-outline",
        t("login.emailPlaceholder"),
        email,
        onEmailChange,
        onEmailBlur,
        emailError,
        false,
        "email"
      )}

      {/* Avertissement email */}
      {emailWarning && (
        <Animated.View entering={FadeInUp.duration(300)} style={tw`ml-3 mb-2`}>
          <Text
            style={[
              tw`text-xs`,
              {
                color: currentTheme.colors.secondary,
              },
            ]}
          >
            ⚠️ {emailWarning}
          </Text>
        </Animated.View>
      )}

      {/* Suggestions d'email */}
      {emailSuggestions.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(300).delay(100)}
          style={tw`ml-3 mb-3`}
        >
          <Text
            style={[
              tw`text-xs mb-1`,
              {
                color: currentTheme.colors.textSecondary,
              },
            ]}
          >
            Vouliez-vous dire :
          </Text>
          {emailSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onEmailSuggestionSelect?.(suggestion)}
              style={[
                tw`py-1 px-2 rounded-lg mb-1`,
                {
                  backgroundColor: currentTheme.colors.primary + "20",
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  tw`text-xs font-medium`,
                  {
                    color: currentTheme.colors.primary,
                  },
                ]}
              >
                📧 {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {renderInputField(
        "lock-outline",
        t("login.passwordPlaceholder"),
        password,
        onPasswordChange,
        onPasswordBlur,
        passwordError,
        true,
        "password"
      )}

      {/* Section des liens avec une meilleure organisation */}
      <View style={tw`mt-1 mb-0`}>
        {/* Forgot Password Link */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={tw`items-end mb-1`}
        >
          <TouchableOpacity activeOpacity={0.7} onPress={onForgotPassword}>
            <Text
              style={[
                tw`text-sm font-medium`,
                { color: currentTheme.colors.primary },
              ]}
            >
              {t("login.forgotPassword")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
