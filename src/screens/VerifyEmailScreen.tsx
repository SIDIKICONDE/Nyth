import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

// Services
import FirebaseAuthService from "../services/firebase/authService";
import { createOptimizedLogger } from "../utils/optimizedLogger";

// Hooks et contextes
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";
import { useCustomAlert } from "../components/ui/CustomAlert";

// Types
import { RootStackParamList } from "../types";

const logger = createOptimizedLogger("VerifyEmailScreen");

type VerifyEmailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "VerifyEmail"
>;

const { width, height } = Dimensions.get("window");

/**
 * Écran de vérification d'email
 * Gère la vérification d'email avec Firebase et offre une UX optimisée
 */
const VerifyEmailScreen: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user, refreshAuthState } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<VerifyEmailNavigationProp>();
  const { showAlert, AlertComponent } = useCustomAlert();

  const isDarkMode = currentTheme.isDark;

  // États
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationCheckCount, setVerificationCheckCount] = useState(0);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);

  // Références
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  /**
   * Animation d'entrée
   */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation pour l'icône
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  /**
   * Nettoyage au démontage
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  /**
   * Vérification automatique de l'email
   */
  const checkEmailVerification = useCallback(async () => {
    if (!mountedRef.current || !autoCheckEnabled) return false;

    try {
      const isVerified = await FirebaseAuthService.checkEmailVerification();

      if (isVerified && mountedRef.current) {
        logger.info("✅ Email vérifié avec succès!");

        // Animation de succès
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Arrêter la vérification automatique
        setAutoCheckEnabled(false);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }

        // Afficher l'alerte de succès
        showAlert({
          type: "success",
          title: t("verifyEmail.verified", "Email vérifié !"),
          message: t(
            "verifyEmail.verifiedMessage",
            "Votre email a été vérifié avec succès. Vous allez être redirigé."
          ),
          buttons: [
            {
              text: t("common.continue"),
              onPress: () => {
                navigation.navigate("Home");
              },
            },
          ],
        });

        // Redirection automatique après 2 secondes
        setTimeout(() => {
          if (mountedRef.current) {
            navigation.navigate("Home");
          }
        }, 2000);

        return true;
      }

      setVerificationCheckCount((prev) => prev + 1);
      return false;
    } catch (error) {
      logger.error("Erreur lors de la vérification:", error);
      return false;
    }
  }, [autoCheckEnabled, navigation, showAlert, t, rotateAnim, scaleAnim]);

  /**
   * Démarrer la vérification automatique
   */
  useFocusEffect(
    useCallback(() => {
      // Vérifier immédiatement
      checkEmailVerification();

      // Puis vérifier toutes les 5 secondes
      checkIntervalRef.current = setInterval(() => {
        checkEmailVerification();
      }, 5000);

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }, [checkEmailVerification])
  );

  /**
   * Gestion du countdown pour le renvoi d'email
   */
  useEffect(() => {
    if (countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [countdown]);

  /**
   * Envoyer l'email de vérification
   */
  const sendVerificationEmail = async () => {
    if (countdown > 0) {
      showAlert({
        type: "warning",
        title: t("verifyEmail.tooSoon", "Veuillez patienter"),
        message: t(
          "verifyEmail.waitMessage",
          `Veuillez attendre ${countdown} secondes avant de renvoyer l'email.`
        ),
        buttons: [{ text: t("common.ok") }],
      });
      return;
    }

    try {
      setIsSending(true);

      // Animation de rotation pendant l'envoi
      const rotationAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();

      await FirebaseAuthService.sendVerificationEmail();

      // Arrêter l'animation
      rotationAnimation.stop();
      rotateAnim.setValue(0);

      setEmailSent(true);
      setCountdown(60); // Attendre 60 secondes avant le prochain envoi

      showAlert({
        type: "success",
        title: t("verifyEmail.sent", "Email envoyé !"),
        message: t(
          "verifyEmail.sentMessage",
          "Un nouvel email de vérification a été envoyé. Vérifiez votre boîte de réception et votre dossier spam."
        ),
        buttons: [{ text: t("common.ok") }],
      });

      // Animation de progression
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: false,
      }).start();
    } catch (error: any) {
      logger.error("Erreur lors de l'envoi de l'email:", error);

      let errorMessage = t(
        "verifyEmail.sendError",
        "Impossible d'envoyer l'email de vérification."
      );

      // Gestion des erreurs spécifiques
      if (error.message?.includes("too-many-requests")) {
        errorMessage = t(
          "verifyEmail.tooManyRequests",
          "Trop de tentatives. Veuillez attendre avant de réessayer."
        );
        setCountdown(300); // 5 minutes d'attente
      } else if (error.message?.includes("network")) {
        errorMessage = t(
          "verifyEmail.networkError",
          "Erreur de réseau. Vérifiez votre connexion internet."
        );
      }

      showAlert({
        type: "error",
        title: t("common.error"),
        message: errorMessage,
        buttons: [{ text: t("common.ok") }],
      });
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Actualiser manuellement le statut
   */
  const refreshStatus = async () => {
    try {
      setIsRefreshing(true);

      // Animation de rotation
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      const isVerified = await checkEmailVerification();

      if (!isVerified) {
        showAlert({
          type: "info",
          title: t("verifyEmail.notYetVerified", "Email non vérifié"),
          message: t(
            "verifyEmail.checkEmailMessage",
            "Votre email n'est pas encore vérifié. Vérifiez votre boîte de réception."
          ),
          buttons: [{ text: t("common.ok") }],
        });
      }

      // Réinitialiser l'animation
      rotateAnim.setValue(0);
    } catch (error) {
      logger.error("Erreur lors de l'actualisation:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t(
          "verifyEmail.refreshError",
          "Erreur lors de l'actualisation"
        ),
        buttons: [{ text: t("common.ok") }],
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Déconnexion
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      await FirebaseAuthService.signOut();

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      logger.error("Erreur lors de la déconnexion:", error);
      showAlert({
        type: "error",
        title: t("common.error"),
        message: t("verifyEmail.logoutError", "Erreur lors de la déconnexion"),
        buttons: [{ text: t("common.ok") }],
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Changer d'adresse email
   */
  const handleChangeEmail = () => {
    showAlert({
      type: "warning",
      title: t("verifyEmail.changeEmail", "Changer d'email"),
      message: t(
        "verifyEmail.changeEmailMessage",
        "Pour changer d'adresse email, vous devez vous déconnecter et créer un nouveau compte."
      ),
      buttons: [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("verifyEmail.logout", "Se déconnecter"),
          onPress: handleLogout,
          style: "destructive",
        },
      ],
    });
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View
        style={[
          tw`flex-1`,
          { backgroundColor: isDarkMode ? "#0A0A0A" : "#FFFFFF" },
        ]}
      >
        {/* Gradient d'arrière-plan */}
        <LinearGradient
          colors={
            isDarkMode
              ? ["#0A0A0A", "#1A1A1A", "#0A0A0A"]
              : ["#FFFFFF", "#F5F5F5", "#FFFFFF"]
          }
          style={tw`absolute inset-0`}
        />

        {/* Cercles décoratifs */}
        <View
          style={[
            tw`absolute -top-20 -left-20 w-40 h-40 rounded-full`,
            { backgroundColor: currentTheme.colors.primary + "10" },
          ]}
        />
        <View
          style={[
            tw`absolute -bottom-20 -right-20 w-60 h-60 rounded-full`,
            { backgroundColor: currentTheme.colors.secondary + "10" },
          ]}
        />

        <ScrollView
          contentContainerStyle={tw`flex-1 px-6 py-12`}
          showsVerticalScrollIndicator={false}
        >
          <View style={tw`flex-1 items-center justify-center`}>
            <Animated.View
              style={[
                tw`items-center mb-10`,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Icône animée */}
              <Animated.View
                style={[
                  tw`w-32 h-32 rounded-full items-center justify-center mb-6`,
                  {
                    backgroundColor: currentTheme.colors.primary + "20",
                    transform: [
                      { scale: pulseAnim },
                      { rotate: rotateInterpolate },
                    ],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={emailSent ? "email-check" : "email-alert"}
                  size={64}
                  color={currentTheme.colors.primary}
                />
              </Animated.View>

              {/* Titre */}
              <Text
                style={[
                  tw`text-2xl font-bold text-center mb-2`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t("verifyEmail.title", "Vérifiez votre email")}
              </Text>

              {/* Sous-titre avec email */}
              <Text
                style={[
                  tw`text-center mb-2`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {t(
                  "verifyEmail.subtitle",
                  "Un email de vérification a été envoyé à"
                )}
              </Text>

              <View
                style={[
                  tw`px-4 py-2 rounded-full mb-4`,
                  { backgroundColor: currentTheme.colors.primary + "10" },
                ]}
              >
                <Text
                  style={[
                    tw`font-medium`,
                    { color: currentTheme.colors.primary },
                  ]}
                >
                  {user?.email || ""}
                </Text>
              </View>

              {/* Instructions */}
              <Text
                style={[
                  tw`text-sm text-center px-8 mb-6`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {t(
                  "verifyEmail.instructions",
                  "Cliquez sur le lien dans l'email pour vérifier votre compte. N'oubliez pas de vérifier votre dossier spam."
                )}
              </Text>

              {/* Indicateur de vérification automatique */}
              {autoCheckEnabled && (
                <View style={tw`flex-row items-center mb-6`}>
                  <ActivityIndicator
                    size="small"
                    color={currentTheme.colors.primary}
                    style={tw`mr-2`}
                  />
                  <Text
                    style={[
                      tw`text-xs`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    {t(
                      "verifyEmail.checking",
                      `Vérification automatique... (${verificationCheckCount})`
                    )}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Boutons d'action */}
            <Animated.View
              style={[
                tw`w-full`,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              {/* Bouton Renvoyer l'email */}
              <TouchableOpacity
                disabled={isSending || countdown > 0}
                onPress={sendVerificationEmail}
                activeOpacity={0.8}
                style={[
                  tw`py-4 px-6 rounded-2xl mb-4 flex-row items-center justify-center`,
                  {
                    backgroundColor:
                      countdown > 0
                        ? currentTheme.colors.primary + "40"
                        : currentTheme.colors.primary,
                  },
                ]}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="email-send"
                      size={20}
                      color="#FFFFFF"
                      style={tw`mr-2`}
                    />
                    <Text style={tw`text-white font-semibold`}>
                      {countdown > 0
                        ? t(
                            "verifyEmail.waitCountdown",
                            `Attendre ${countdown}s`
                          )
                        : t("verifyEmail.resend", "Renvoyer l'email")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Barre de progression du countdown */}
              {countdown > 0 && (
                <View
                  style={[
                    tw`h-1 rounded-full mb-4 overflow-hidden`,
                    { backgroundColor: currentTheme.colors.primary + "20" },
                  ]}
                >
                  <Animated.View
                    style={[
                      tw`h-full rounded-full`,
                      {
                        backgroundColor: currentTheme.colors.primary,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["100%", "0%"],
                        }),
                      },
                    ]}
                  />
                </View>
              )}

              {/* Bouton Actualiser */}
              <TouchableOpacity
                disabled={isRefreshing}
                onPress={refreshStatus}
                activeOpacity={0.8}
                style={[
                  tw`py-3 px-6 rounded-2xl mb-4 border flex-row items-center justify-center`,
                  {
                    borderColor: currentTheme.colors.primary,
                    backgroundColor: "transparent",
                  },
                ]}
              >
                {isRefreshing ? (
                  <ActivityIndicator color={currentTheme.colors.primary} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="refresh"
                      size={20}
                      color={currentTheme.colors.primary}
                      style={tw`mr-2`}
                    />
                    <Text
                      style={[
                        tw`font-semibold`,
                        { color: currentTheme.colors.primary },
                      ]}
                    >
                      {t("verifyEmail.refresh", "J'ai vérifié mon email")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Liens secondaires */}
              <View style={tw`items-center mt-6`}>
                <TouchableOpacity
                  onPress={handleChangeEmail}
                  activeOpacity={0.7}
                  style={tw`mb-4`}
                >
                  <Text
                    style={[
                      tw`text-sm`,
                      { color: currentTheme.colors.primary },
                    ]}
                  >
                    {t("verifyEmail.wrongEmail", "Mauvaise adresse email ?")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                  activeOpacity={0.7}
                  disabled={isLoggingOut}
                >
                  <Text
                    style={[tw`text-sm`, { color: currentTheme.colors.error }]}
                  >
                    {isLoggingOut
                      ? t("common.loading")
                      : t("verifyEmail.logout", "Se déconnecter")}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Conseils */}
            <View
              style={[
                tw`mt-8 p-4 rounded-xl`,
                { backgroundColor: currentTheme.colors.warning + "10" },
              ]}
            >
              <View style={tw`flex-row items-start`}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={20}
                  color={currentTheme.colors.warning}
                  style={tw`mr-2 mt-1`}
                />
                <View style={tw`flex-1`}>
                  <Text
                    style={[
                      tw`text-sm font-semibold mb-1`,
                      { color: currentTheme.colors.warning },
                    ]}
                  >
                    {t("verifyEmail.tipsTitle", "Conseils")}
                  </Text>
                  <Text
                    style={[
                      tw`text-xs`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    {t(
                      "verifyEmail.tips",
                      "• Vérifiez votre dossier spam ou courrier indésirable\n• L'email peut prendre quelques minutes à arriver\n• Assurez-vous que l'adresse email est correcte"
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Custom Alert */}
      <AlertComponent />
    </>
  );
};

export default VerifyEmailScreen;
