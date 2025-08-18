import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types";
import { LoginSocialButtons } from "../../components/auth";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from "@env";
const logger = createOptimizedLogger('RegisterScreen');

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const { signUp } = useAuth();
  const isDarkMode = currentTheme.isDark;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  React.useEffect(() => {
    if (__DEV__) {
      try {
        const mask = (v?: string | null) =>
          !v ? "undefined" : `${String(v).slice(0, 8)}...${String(v).slice(-6)}`;
        logger.debug("[RegisterScreen] ENV check", {
          webClientId: mask(GOOGLE_WEB_CLIENT_ID as unknown as string),
          iosClientId: mask(GOOGLE_IOS_CLIENT_ID as unknown as string),
        });
      } catch (e) {}
    }
  }, []);

  // Validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(t("auth.register.errors.emailRequired"));
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError(t("auth.register.errors.emailInvalid"));
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError(t("auth.register.errors.passwordRequired"));
      return false;
    } else if (password.length < 6) {
      setPasswordError(t("auth.register.errors.passwordLength"));
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError(
        t("auth.register.errors.confirmPasswordRequired")
      );
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError(t("auth.register.errors.passwordMismatch"));
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleRegister = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    try {
      setIsLoading(true);
      const success = await signUp(email, password, "");
      if (success) {
        navigation.navigate("Home");
      }
    } catch (error) {
      logger.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputField = (
    icon: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    onBlur: () => void,
    error: string,
    secureTextEntry?: boolean,
    isPasswordVisible?: boolean,
    onTogglePasswordVisibility?: () => void
  ) => (
    <View style={tw`mb-4`}>
      <View
        style={[
          tw`rounded-xl overflow-hidden`,
          {
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(255, 255, 255, 0.8)",
            borderWidth: 1,
            borderColor: error
              ? currentTheme.colors.error
              : isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
          },
        ]}
      >
        <View style={tw`flex-row items-center px-4 py-4`}>
          <View
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
              {
                backgroundColor: `${currentTheme.colors.primary}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={currentTheme.colors.primary}
            />
          </View>

          <TextInput
            style={[
              tw`flex-1 text-base font-medium`,
              { color: currentTheme.colors.text },
            ]}
            placeholder={placeholder}
            placeholderTextColor={currentTheme.colors.text + "60"}
            value={value}
            onChangeText={onChangeText}
            onBlur={onBlur}
            keyboardType={
              icon === "email-outline" ? "email-address" : "default"
            }
            autoCapitalize="none"
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            autoCorrect={false}
          />

          {secureTextEntry && onTogglePasswordVisibility && (
            <TouchableOpacity
              style={tw`p-2`}
              onPress={onTogglePasswordVisibility}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={currentTheme.colors.text + "80"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error ? (
        <Text
          style={[tw`text-xs ml-4 mt-1`, { color: currentTheme.colors.error }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          currentTheme.colors.secondary + "20",
          currentTheme.colors.primary + "10",
          "transparent",
        ]}
        style={tw`absolute inset-0`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Circles supprimés (pas d'animation) */}

      {/* Back Button */}
      <View
        style={[
          tw`absolute top-12 left-4 z-10`,
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            tw`w-12 h-12 rounded-full items-center justify-center`,
            {
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={currentTheme.colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 py-20`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={tw`flex-1 justify-center min-h-full`}>
          {/* Icon and Title */}
          <View style={tw`items-center mb-8`}>
            <View style={tw`mb-4`}>
              <View
                style={[
                  tw`w-24 h-24 rounded-full items-center justify-center`,
                  {
                    backgroundColor: currentTheme.colors.secondary + "20",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={48}
                  color={currentTheme.colors.secondary}
                />
              </View>
            </View>

            <Text
              style={[
                tw`text-3xl font-bold text-center mb-2`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("auth.register.title", "Créer un compte")}
            </Text>

            <Text
              style={[
                tw`text-base text-center px-8`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "auth.register.subtitle",
                "Créez votre compte pour sauvegarder vos scripts"
              )}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={tw`mb-6`}>
            {renderInputField(
              "email-outline",
              t("auth.register.emailPlaceholder"),
              email,
              setEmail,
              () => validateEmail(email),
              emailError
            )}

            {renderInputField(
              "lock-outline",
              t("auth.register.passwordPlaceholder"),
              password,
              setPassword,
              () => validatePassword(password),
              passwordError,
              true,
              isPasswordVisible,
              () => setIsPasswordVisible(!isPasswordVisible)
            )}

            {renderInputField(
              "lock-check-outline",
              t("auth.register.confirmPasswordPlaceholder"),
              confirmPassword,
              setConfirmPassword,
              () => validateConfirmPassword(confirmPassword),
              confirmPasswordError,
              true,
              isConfirmPasswordVisible,
              () => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
            )}
          </View>

          {/* Register Button */}
          <View style={tw`mb-6`}>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  currentTheme.colors.secondary,
                  currentTheme.colors.primary,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  tw`py-4 rounded-2xl items-center justify-center flex-row`,
                  {
                    shadowColor: currentTheme.colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="account-plus"
                      size={20}
                      color="#ffffff"
                      style={tw`mr-2`}
                    />
                    <Text style={tw`text-white font-bold text-base`}>
                      {t("auth.register.createAccount", "Créer un compte")}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Social Buttons */}
          <View style={tw`mb-6`}>
            <LoginSocialButtons />
          </View>

          {/* Back to Login Link */}
          <View style={tw`items-center`}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  tw`text-sm font-medium`,
                  { color: currentTheme.colors.primary },
                ]}
              >
                {t("auth.register.haveAccount", "Vous avez déjà un compte ?")} {" "}
                <Text
                  style={[
                    tw`font-bold`,
                    { color: currentTheme.colors.primary },
                  ]}
                >
                  {t("auth.register.signIn", "Se connecter")}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}