import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";
import { RootStackParamList } from "../types/navigation";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("ForgotPasswordScreen");
const { width: screenWidth } = Dimensions.get("window");

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const { resetPassword } = useAuth();
  const isDarkMode = currentTheme.isDark;

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Animations natives
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const iconRotation = React.useRef(new Animated.Value(0)).current;
  const iconScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation continue de l'icône
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    scaleAnimation.start();

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
    };
  }, []);

  const animatedIconStyle = {
    transform: [
      {
        rotate: iconRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
      { scale: iconScale },
    ],
  };

  // Validation de l'email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(t("forgotPassword.errors.emailRequired"));
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError(t("forgotPassword.errors.emailInvalid"));
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      setIsLoading(true);
      logger.info(t("forgotPassword.logs.resetRequest"), { email });

      // Utiliser Firebase pour envoyer l'email de réinitialisation
      const success = await resetPassword(email);

      if (success) {
        setEmailSent(true);
        Alert.alert(
          t("forgotPassword.successTitle", "✅ Email envoyé"),
          t(
            "forgotPassword.successMessage",
            "Un email de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception."
          ),
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        Alert.alert(
          t("forgotPassword.errorTitle"),
          t("forgotPassword.errorMessage")
        );
      }
    } catch (error) {
      logger.error(t("forgotPassword.logs.resetError"), error);
      Alert.alert(
        t("forgotPassword.errorTitle"),
        t("forgotPassword.errorMessage")
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          currentTheme.colors.primary + "20",
          currentTheme.colors.secondary + "10",
          "transparent",
        ]}
        style={tw`absolute inset-0`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Circles */}
      <Animated.View
        style={[
          tw`absolute -top-20 -right-20 w-60 h-60 rounded-full`,
          {
            backgroundColor: currentTheme.colors.primary + "10",
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          tw`absolute -bottom-20 -left-20 w-80 h-80 rounded-full`,
          {
            backgroundColor: currentTheme.colors.secondary + "10",
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, -30],
                }),
              },
            ],
          },
        ]}
      />

      {/* Back Button */}
      <Animated.View
        style={[
          tw`absolute top-12 left-4 z-10`,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
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
      </Animated.View>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 py-20`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={tw`flex-1 justify-center min-h-full`}>
          {/* Icon and Title */}
          <Animated.View
            style={[
              tw`items-center mb-8`,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Animated.View style={[animatedIconStyle, tw`mb-4`]}>
              <View
                style={[
                  tw`w-24 h-24 rounded-full items-center justify-center`,
                  {
                    backgroundColor: currentTheme.colors.primary + "20",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={emailSent ? "check-circle" : "lock-reset"}
                  size={48}
                  color={currentTheme.colors.primary}
                />
              </View>
            </Animated.View>

            <Text
              style={[
                tw`text-3xl font-bold text-center mb-2`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("forgotPassword.title", "Mot de passe oublié")}
            </Text>

            <Text
              style={[
                tw`text-base text-center px-8`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "forgotPassword.subtitle",
                "Entrez votre email pour recevoir un lien de réinitialisation"
              )}
            </Text>
          </Animated.View>

          {/* Email Input */}
          <Animated.View
            style={[
              tw`mb-6`,
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 20],
                  }) 
                }],
              },
            ]}
          >
            <View
              style={[
                tw`rounded-2xl overflow-hidden`,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(255, 255, 255, 0.8)",
                  borderWidth: 1,
                  borderColor: emailError
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
                    name="email-outline"
                    size={20}
                    color={currentTheme.colors.primary}
                  />
                </View>

                <TextInput
                  style={[
                    tw`flex-1 text-base font-medium`,
                    { color: currentTheme.colors.text },
                  ]}
                  placeholder={t(
                    "forgotPassword.emailPlaceholder",
                    "Votre adresse email"
                  )}
                  placeholderTextColor={currentTheme.colors.text + "60"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={() => validateEmail(email)}
                  editable={!emailSent}
                />
              </View>
            </View>

            {emailError ? (
              <Animated.Text
                style={[
                  tw`text-xs ml-4 mt-2`,
                  { 
                    color: currentTheme.colors.error,
                    opacity: fadeAnim,
                  },
                ]}
              >
                {emailError}
              </Animated.Text>
            ) : null}
          </Animated.View>

          {/* Reset Button */}
          <Animated.View
            style={[
              tw`mb-4`,
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 30],
                  }) 
                }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading || emailSent}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  currentTheme.colors.primary,
                  currentTheme.colors.secondary,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  tw`py-4 rounded-2xl items-center justify-center flex-row`,
                  {
                    opacity: emailSent ? 0.6 : 1,
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
                      name={emailSent ? "check" : "email-send"}
                      size={20}
                      color="#ffffff"
                      style={tw`mr-2`}
                    />
                    <Text style={tw`text-white font-bold text-base`}>
                      {emailSent
                        ? t("forgotPassword.emailSent", "Email envoyé")
                        : t("forgotPassword.resetButton", "Envoyer le lien")}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Back to Login Link */}
          <Animated.View
            style={[
              tw`items-center`,
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 40],
                  }) 
                }],
              },
            ]}
          >
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
                {t("forgotPassword.backToLogin", "Retour à la connexion")}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Info Text */}
          <Animated.View
            style={[
              tw`mt-8 px-8`,
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50],
                  }) 
                }],
              },
            ]}
          >
            <Text
              style={[
                tw`text-xs text-center`,
                { color: currentTheme.colors.textMuted },
              ]}
            >
              {t(
                "forgotPassword.info",
                "Vous recevrez un email avec un lien pour réinitialiser votre mot de passe. Vérifiez également votre dossier spam."
              )}
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;
