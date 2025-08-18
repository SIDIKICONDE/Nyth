import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTranslation } from "../../../hooks/useTranslation";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  useRegisterForm,
  useRegisterValidation,
  useRegisterSubmit,
} from "../hooks";
import FormField from "./FormField";
import RegisterHeader from "./RegisterHeader";
import RegisterFooter from "./RegisterFooter";
import { LoginSocialButtons } from "../../../components/auth";

interface RegisterFormProps {
  onNavigateToLogin: () => void;
}

export default function RegisterForm({ onNavigateToLogin }: RegisterFormProps) {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { validateForm, validateField } = useRegisterValidation();
  const { handleSubmit } = useRegisterSubmit();

  const {
    formData,
    errors,
    isPasswordVisible,
    isConfirmPasswordVisible,
    isLoading,
    updateField,
    setFieldError,
    setIsPasswordVisible,
    setIsConfirmPasswordVisible,
    setIsLoading,
  } = useRegisterForm();

  const handleFieldBlur = (field: keyof typeof formData) => {
    const error = validateField(field, formData[field], formData);
    if (error) {
      setFieldError(field, error);
    }
  };

  const handleRegister = async () => {
    const { errors: validationErrors, isValid } = validateForm(formData);

    if (!isValid) {
      Object.entries(validationErrors).forEach(([field, error]) => {
        if (error) {
          setFieldError(field as keyof typeof errors, error);
        }
      });
      return;
    }

    await handleSubmit(formData, setIsLoading);
  };

  return (
    <View>
      {/* En-tête */}
      <RegisterHeader
        title={t("auth.register.title")}
        subtitle={t("auth.register.subtitle")}
      />

      <View style={tw`px-6 mt-4`}>
        {/* Champ Email */}
        <FormField
          label={t("auth.register.email")}
          placeholder={t("auth.register.emailPlaceholder")}
          value={formData.email}
          onChangeText={(text) => updateField("email", text)}
          onBlur={() => handleFieldBlur("email")}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          iconName="email-outline"
        />

        {/* Champ Mot de passe */}
        <FormField
          label={t("auth.register.password")}
          placeholder={t("auth.register.passwordPlaceholder")}
          value={formData.password}
          onChangeText={(text) => updateField("password", text)}
          onBlur={() => handleFieldBlur("password")}
          error={errors.password}
          secureTextEntry={true}
          isPasswordVisible={isPasswordVisible}
          onTogglePasswordVisibility={() =>
            setIsPasswordVisible(!isPasswordVisible)
          }
          iconName="lock-outline"
        />

        {/* Champ Confirmation mot de passe */}
        <FormField
          label={t("auth.register.confirmPassword")}
          placeholder={t("auth.register.confirmPasswordPlaceholder")}
          value={formData.confirmPassword}
          onChangeText={(text) => updateField("confirmPassword", text)}
          onBlur={() => handleFieldBlur("confirmPassword")}
          error={errors.confirmPassword}
          secureTextEntry={true}
          isPasswordVisible={isConfirmPasswordVisible}
          onTogglePasswordVisibility={() =>
            setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
          }
          iconName="lock-check-outline"
        />

        {/* Bouton d'inscription */}
        <View style={tw`mb-4 mt-1`}>
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
                tw`py-3.5 rounded-xl items-center justify-center flex-row`,
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
                  <Text style={tw`text-white font-bold text-base mr-2`}>
                    {t("auth.register.createAccount")}
                  </Text>
                  <MaterialCommunityIcons
                    name="account-plus"
                    size={20}
                    color="#ffffff"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Séparateur visuel */}
        <View style={tw`flex-row items-center mb-3`}>
          <View
            style={[
              tw`flex-1 h-px`,
              { backgroundColor: currentTheme.colors.text + "15" },
            ]}
          />
          <View
            style={[
              tw`px-3 py-1`,
              { backgroundColor: currentTheme.colors.background },
            ]}
          >
            <View
              style={[
                tw`w-1.5 h-1.5 rounded-full`,
                { backgroundColor: currentTheme.colors.textSecondary + "30" },
              ]}
            />
          </View>
          <View
            style={[
              tw`flex-1 h-px`,
              { backgroundColor: currentTheme.colors.text + "15" },
            ]}
          />
        </View>

        {/* Boutons de réseaux sociaux */}
        <View style={tw`mb-4`}>
          <LoginSocialButtons />
        </View>

        {/* Pied de page */}
        <RegisterFooter onNavigateToLogin={onNavigateToLogin} />
      </View>
    </View>
  );
}
