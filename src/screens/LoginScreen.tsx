import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
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
  Alert,
  Keyboard,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

// Services et utilitaires
import FirebaseAuthService from "../services/firebase/authService";
import {
  validateEmail,
  validatePassword,
  calculatePasswordStrength,
} from "../utils/authValidation";
import { createOptimizedLogger } from "../utils/optimizedLogger";

// Composants
import LoginSocialButtons from "../components/auth/LoginSocialButtons";
import { EmailSuggestionAlert } from "../components/auth/EmailSuggestionAlert";

// Hooks et contextes
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useGlobalPreferencesContext } from "../contexts/GlobalPreferencesContext";
import { useTranslation } from "../hooks/useTranslation";
import { useCustomAlert } from "../components/ui/CustomAlert";

// Types
import { RootStackParamList } from "../types";

const logger = createOptimizedLogger("LoginScreen");

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

const { width, height } = Dimensions.get("window");

/**
 * Écran de connexion avec Firebase Authentication
 * Implémente les meilleures pratiques de sécurité et d'UX
 */
const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route = useRoute();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme.isDark;
  const { user, loading: authLoading } = useAuth();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { homePage } = useGlobalPreferencesContext();

  // États du formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestionAlert, setShowSuggestionAlert] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);

  // Références
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Paramètres de navigation
  const isFromLogout = (route.params as any)?.fromLogout || false;
  const returnTo = (route.params as any)?.returnTo;

  /**
   * Animation d'entrée
   */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Charger l'email sauvegardé et vérifier le verrouillage
   */
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Charger l'email sauvegardé
        const savedEmail = await AsyncStorage.getItem("@last_email");
        if (savedEmail) {
          setEmail(savedEmail);
        }

        // Vérifier le verrouillage du compte
        const lockoutData = await AsyncStorage.getItem("@account_lockout");
        if (lockoutData) {
          const { endTime, attempts } = JSON.parse(lockoutData);
          const lockoutEnd = new Date(endTime);

          if (lockoutEnd > new Date()) {
            setIsAccountLocked(true);
            setLockoutEndTime(lockoutEnd);
            setLoginAttempts(attempts);
            startLockoutTimer(lockoutEnd);
          } else {
            // Le verrouillage a expiré, nettoyer
            await AsyncStorage.removeItem("@account_lockout");
          }
        }
      } catch (error) {
        logger.error(
          "Erreur lors du chargement des données sauvegardées:",
          error
        );
      }
    };

    loadSavedData();
  }, []);

  /**
   * Rediriger si déjà connecté
   */
  useEffect(() => {
    if (user && !authLoading && !isFromLogout) {
      logger.debug("Utilisateur déjà connecté, redirection...");

      // Rediriger vers la page demandée ou la page d'accueil
      if (returnTo) {
        navigation.replace(returnTo as any);
      } else {
        switch (homePage) {
          case "planning":
            navigation.replace("Planning");
            break;
          case "ai-chat":
            navigation.replace("AIChat" as any);
            break;
          default:
            navigation.replace("Home");
        }
      }
    }
  }, [user, authLoading, navigation, isFromLogout, returnTo, homePage]);

  /**
   * Nettoyer les timers au démontage
   */
  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) {
        clearTimeout(lockoutTimerRef.current);
      }
    };
  }, []);

  /**
   * Démarrer le timer de verrouillage
   */
  const startLockoutTimer = (endTime: Date) => {
    if (lockoutTimerRef.current) {
      clearTimeout(lockoutTimerRef.current);
    }

    const checkLockout = () => {
      const now = new Date();
      if (now >= endTime) {
        setIsAccountLocked(false);
        setLockoutEndTime(null);
        setLoginAttempts(0);
        AsyncStorage.removeItem("@account_lockout");
      } else {
        lockoutTimerRef.current = setTimeout(checkLockout, 1000);
      }
    };

    checkLockout();
  };

  /**
   * Animation de secousse pour les erreurs
   */
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Validation de l'email avec suggestions
   */
  const handleEmailValidation = useCallback(() => {
    const validation = validateEmail(email);

    if (!validation.isValid) {
      setEmailError(validation.errors[0] || t("login.errors.emailInvalid"));

      if (validation.suggestions && validation.suggestions.length > 0) {
        setEmailSuggestions(validation.suggestions);
        setShowSuggestionAlert(true);
      }
    } else {
      setEmailError("");
      setEmailSuggestions([]);
      setShowSuggestionAlert(false);
    }

    return validation.isValid;
  }, [email, t]);

  /**
   * Validation du mot de passe
   */
  const handlePasswordValidation = useCallback(() => {
    if (!password) {
      setPasswordError(t("login.errors.passwordRequired"));
      return false;
    }

    if (password.length < 6) {
      setPasswordError(t("login.errors.passwordLength"));
      return false;
    }

    setPasswordError("");
    return true;
  }, [password, t]);

  /**
   * Gestion de la connexion
   */
  const handleLogin = async () => {
    try {
      // Vérifier le verrouillage
      if (isAccountLocked && lockoutEndTime) {
        const remainingTime = Math.ceil(
          (lockoutEndTime.getTime() - Date.now()) / 60000
        );
        showAlert({
          type: "error",
          title: t("login.accountLocked", "Compte verrouillé"),
          message: t(
            "login.accountLockedMessage",
            `Trop de tentatives échouées. Réessayez dans ${remainingTime} minutes.`
          ),
          buttons: [{ text: t("common.ok"), style: "cancel" }],
        });
        return;
      }

      // Validation
      const isEmailValid = handleEmailValidation();
      const isPasswordValid = handlePasswordValidation();

      if (!isEmailValid || !isPasswordValid) {
        shakeAnimation();
        return;
      }

      // Fermer le clavier
      Keyboard.dismiss();

      setIsLoading(true);

      // Animation de progression
      Animated.timing(progressAnim, {
        toValue: 0.5,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // Tentative de connexion
      const user = await FirebaseAuthService.signInWithEmail(email, password);

      // Réinitialiser les tentatives en cas de succès
      setLoginAttempts(0);
      await AsyncStorage.removeItem("@account_lockout");
      await AsyncStorage.setItem("@last_email", email);

      // Animation de succès
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Vérifier si l'email est vérifié
      if (!user.emailVerified) {
        showAlert({
          type: "warning",
          title: t("login.emailNotVerified", "Email non vérifié"),
          message: t(
            "login.emailNotVerifiedMessage",
            "Veuillez vérifier votre email avant de vous connecter."
          ),
          buttons: [
            {
              text: t("login.resendVerification", "Renvoyer l'email"),
              onPress: async () => {
                try {
                  await FirebaseAuthService.sendVerificationEmail(user);
                  showAlert({
                    type: "success",
                    title: t("common.success"),
                    message: t(
                      "login.verificationEmailSent",
                      "Email de vérification envoyé"
                    ),
                    buttons: [{ text: t("common.ok") }],
                  });
                } catch (error) {
                  logger.error(
                    "Erreur lors de l'envoi de l'email de vérification:",
                    error
                  );
                }
              },
            },
            {
              text: t("common.ok"),
              style: "cancel",
            },
          ],
        });

        // Déconnecter l'utilisateur
        await FirebaseAuthService.signOut();
        return;
      }

      // Succès de la connexion
      showAlert({
        type: "success",
        title: t("login.success", "Connexion réussie"),
        message: t("login.welcomeBack", "Bienvenue !"),
        buttons: [
          {
            text: t("common.continue"),
            onPress: () => {
              // Navigation vers la page appropriée
              if (returnTo) {
                navigation.navigate(returnTo as any);
              } else {
                switch (homePage) {
                  case "planning":
                    navigation.navigate("Planning");
                    break;
                  case "ai-chat":
                    navigation.navigate("AIChat" as any);
                    break;
                  default:
                    navigation.navigate("Home");
                }
              }
            },
          },
        ],
      });
    } catch (error: any) {
      logger.error("Erreur de connexion:", error);

      // Incrémenter les tentatives
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Vérifier si le compte doit être verrouillé
      if (newAttempts >= 5) {
        const lockoutEnd = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        setIsAccountLocked(true);
        setLockoutEndTime(lockoutEnd);

        // Sauvegarder le verrouillage
        await AsyncStorage.setItem(
          "@account_lockout",
          JSON.stringify({
            endTime: lockoutEnd.toISOString(),
            attempts: newAttempts,
          })
        );

        startLockoutTimer(lockoutEnd);

        showAlert({
          type: "error",
          title: t("login.accountLocked", "Compte verrouillé"),
          message: t(
            "login.tooManyAttempts",
            "Trop de tentatives échouées. Votre compte est temporairement verrouillé."
          ),
          buttons: [{ text: t("common.ok"), style: "cancel" }],
        });
      } else {
        // Afficher l'erreur spécifique
        let errorMessage = error.message || t("login.unexpectedError");

        // Personnaliser les messages d'erreur
        if (error.message?.includes("email-not-verified")) {
          navigation.navigate("VerifyEmail");
          return;
        } else if (error.message?.includes("user-not-found")) {
          errorMessage = t(
            "login.userNotFound",
            "Aucun compte trouvé avec cet email"
          );
        } else if (error.message?.includes("wrong-password")) {
          errorMessage = t("login.wrongPassword", "Mot de passe incorrect");
          errorMessage += ` (${5 - newAttempts} tentatives restantes)`;
        }

        showAlert({
          type: "error",
          title: t("login.error", "Erreur de connexion"),
          message: errorMessage,
          buttons: [{ text: t("common.ok"), style: "cancel" }],
        });

        shakeAnimation();
      }
    } finally {
      setIsLoading(false);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  /**
   * Navigation vers l'écran de mot de passe oublié
   */
  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  /**
   * Navigation vers l'écran d'inscription
   */
  const handleSignUp = () => {
    navigation.navigate("RegisterScreen");
  };

  /**
   * Sélection d'une suggestion d'email
   */
  const handleEmailSuggestionSelect = (suggestion: string) => {
    setEmail(suggestion);
    setEmailError("");
    setEmailSuggestions([]);
    setShowSuggestionAlert(false);
  };

  /**
   * Calcul de la force du mot de passe (pour affichage visuel)
   */
  const passwordStrength = calculatePasswordStrength(password);
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return "#FF4444";
    if (passwordStrength < 60) return "#FFA500";
    if (passwordStrength < 80) return "#FFD700";
    return "#00C851";
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          tw`flex-1`,
          { backgroundColor: isDarkMode ? "#0A0A0A" : "#FFFFFF" },
        ]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        {/* Gradient d'arrière-plan */}
        <LinearGradient
          colors={
            isDarkMode
              ? ["#0A0A0A", "#0F0F0F", "#0A0A0A"]
              : ["#FFFFFF", "#FAFAFA", "#F5F5F5"]
          }
          style={tw`absolute inset-0`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Cercle décoratif */}
        <View
          style={[
            tw`absolute -top-40 -right-40 w-80 h-80 rounded-full`,
            {
              backgroundColor: currentTheme.colors.primary + "08",
            },
          ]}
        />

        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-8 py-12`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={tw`flex-1 justify-center min-h-full`}>
            {/* Logo et titre */}
            <Animated.View
              style={[
                tw`items-center mb-12`,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY },
                    { scale: scaleAnim },
                    { translateX: shakeAnim },
                  ],
                },
              ]}
            >
              {/* Logo avec animation */}
              <View
                style={[
                  tw`w-20 h-20 rounded-full items-center justify-center mb-8`,
                  {
                    backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F8F8",
                    borderWidth: 1,
                    borderColor: isDarkMode ? "#2A2A2A" : "#E5E5E5",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={36}
                  color={currentTheme.colors.primary}
                />
              </View>

              <Text
                style={[
                  tw`text-3xl font-light mb-2`,
                  {
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                    letterSpacing: 1,
                  },
                ]}
              >
                {t("login.welcome", "Bienvenue")}
              </Text>

              <Text
                style={[
                  tw`text-sm opacity-60`,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {t("login.subtitle", "Connectez-vous pour continuer")}
              </Text>

              {/* Indicateur de verrouillage */}
              {isAccountLocked && lockoutEndTime && (
                <View
                  style={[
                    tw`mt-4 px-4 py-2 rounded-full flex-row items-center`,
                    { backgroundColor: currentTheme.colors.error + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-clock"
                    size={16}
                    color={currentTheme.colors.error}
                    style={tw`mr-2`}
                  />
                  <Text
                    style={[tw`text-xs`, { color: currentTheme.colors.error }]}
                  >
                    {t("login.lockedUntil", "Verrouillé jusqu'à")}{" "}
                    {lockoutEndTime.toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Formulaire */}
            <Animated.View
              style={[
                tw`mb-8`,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY }, { translateX: shakeAnim }],
                },
              ]}
            >
              {/* Champ Email */}
              <View style={tw`mb-4`}>
                <View
                  style={[
                    tw`flex-row items-center px-4 py-4 rounded-2xl`,
                    {
                      backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F8F8",
                      borderWidth: emailError ? 1 : 0,
                      borderColor: emailError
                        ? currentTheme.colors.error
                        : "transparent",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={isDarkMode ? "#666" : "#999"}
                    style={tw`mr-3`}
                  />
                  <TextInput
                    ref={emailInputRef}
                    style={[
                      tw`flex-1 text-base`,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                    placeholder={t("login.emailPlaceholder", "Email")}
                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                    value={email}
                    onChangeText={setEmail}
                    onBlur={handleEmailValidation}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    editable={!isLoading && !isAccountLocked}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                  {email.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setEmail("")}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={18}
                        color={isDarkMode ? "#666" : "#999"}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {emailError ? (
                  <Text
                    style={[
                      tw`text-xs mt-2 ml-4`,
                      { color: currentTheme.colors.error },
                    ]}
                  >
                    {emailError}
                  </Text>
                ) : null}
              </View>

              {/* Champ Mot de passe */}
              <View style={tw`mb-2`}>
                <View
                  style={[
                    tw`flex-row items-center px-4 py-4 rounded-2xl`,
                    {
                      backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F8F8",
                      borderWidth: passwordError ? 1 : 0,
                      borderColor: passwordError
                        ? currentTheme.colors.error
                        : "transparent",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={isDarkMode ? "#666" : "#999"}
                    style={tw`mr-3`}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    style={[
                      tw`flex-1 text-base`,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                    placeholder={t("login.passwordPlaceholder", "Mot de passe")}
                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={handlePasswordValidation}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    textContentType="password"
                    editable={!isLoading && !isAccountLocked}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    activeOpacity={0.7}
                    disabled={isLoading || isAccountLocked}
                  >
                    <MaterialCommunityIcons
                      name={
                        isPasswordVisible ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color={isDarkMode ? "#666" : "#999"}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text
                    style={[
                      tw`text-xs mt-2 ml-4`,
                      { color: currentTheme.colors.error },
                    ]}
                  >
                    {passwordError}
                  </Text>
                ) : null}
              </View>

              {/* Indicateur de force du mot de passe (visuel uniquement) */}
              {password.length > 0 && (
                <View style={tw`mb-6 px-4`}>
                  <View
                    style={[
                      tw`h-1 rounded-full overflow-hidden`,
                      { backgroundColor: isDarkMode ? "#2A2A2A" : "#E5E5E5" },
                    ]}
                  >
                    <Animated.View
                      style={[
                        tw`h-full rounded-full`,
                        {
                          width: `${passwordStrength}%`,
                          backgroundColor: getPasswordStrengthColor(),
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Lien mot de passe oublié */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleForgotPassword}
                style={tw`mb-8`}
                disabled={isLoading || isAccountLocked}
              >
                <Text
                  style={[
                    tw`text-sm text-center`,
                    { color: currentTheme.colors.primary },
                  ]}
                >
                  {t("login.forgotPassword", "Mot de passe oublié ?")}
                </Text>
              </TouchableOpacity>

              {/* Bouton de connexion */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading || isAccountLocked}
                activeOpacity={0.9}
                style={[
                  tw`py-4 rounded-2xl items-center justify-center overflow-hidden`,
                  {
                    backgroundColor: isAccountLocked
                      ? currentTheme.colors.error + "40"
                      : currentTheme.colors.primary,
                  },
                ]}
              >
                {/* Barre de progression */}
                <Animated.View
                  style={[
                    tw`absolute left-0 top-0 bottom-0`,
                    {
                      backgroundColor: currentTheme.colors.primary + "30",
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />

                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={tw`flex-row items-center`}>
                    <MaterialCommunityIcons
                      name={isAccountLocked ? "lock" : "login"}
                      size={20}
                      color="#FFFFFF"
                      style={tw`mr-2`}
                    />
                    <Text style={tw`text-white font-medium text-base`}>
                      {isAccountLocked
                        ? t("login.accountLocked", "Compte verrouillé")
                        : t("login.signIn", "Se connecter")}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Indicateur de tentatives restantes */}
              {loginAttempts > 0 && loginAttempts < 5 && (
                <Text
                  style={[
                    tw`text-xs text-center mt-2`,
                    { color: currentTheme.colors.warning },
                  ]}
                >
                  {t(
                    "login.attemptsRemaining",
                    `${5 - loginAttempts} tentatives restantes`
                  )}
                </Text>
              )}
            </Animated.View>

            {/* Séparateur */}
            <Animated.View
              style={[
                tw`flex-row items-center mb-8`,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View
                style={[
                  tw`flex-1 h-px`,
                  { backgroundColor: isDarkMode ? "#2A2A2A" : "#E5E5E5" },
                ]}
              />
              <Text
                style={[
                  tw`px-4 text-xs`,
                  { color: isDarkMode ? "#666" : "#999" },
                ]}
              >
                {t("common.or", "ou")}
              </Text>
              <View
                style={[
                  tw`flex-1 h-px`,
                  { backgroundColor: isDarkMode ? "#2A2A2A" : "#E5E5E5" },
                ]}
              />
            </Animated.View>

            {/* Boutons sociaux */}
            <Animated.View
              style={[
                tw`mb-8`,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <LoginSocialButtons isDisabled={isLoading || isAccountLocked} />
            </Animated.View>

            {/* Liens en bas */}
            <Animated.View
              style={[
                tw`items-center`,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleSignUp}
                activeOpacity={0.7}
                style={tw`mb-4`}
                disabled={isLoading || isAccountLocked}
              >
                <Text
                  style={[tw`text-sm`, { color: isDarkMode ? "#888" : "#666" }]}
                >
                  {t("login.noAccount", "Pas encore de compte ?")}{" "}
                  <Text
                    style={{
                      color: currentTheme.colors.primary,
                      fontWeight: "500",
                    }}
                  >
                    {t("login.signUp", "S'inscrire")}
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("PrivacyPolicyScreen")}
                activeOpacity={0.7}
              >
                <Text
                  style={[tw`text-xs`, { color: isDarkMode ? "#555" : "#AAA" }]}
                >
                  {t("login.privacyPolicy", "Politique de confidentialité")}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      <AlertComponent />

      {/* Email Suggestion Alert */}
      <EmailSuggestionAlert
        visible={showSuggestionAlert}
        suggestions={emailSuggestions}
        onSuggestionSelect={handleEmailSuggestionSelect}
        onDismiss={() => setShowSuggestionAlert(false)}
      />
    </>
  );
};

export default LoginScreen;
