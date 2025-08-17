import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { RootStackParamList } from "../../../types/navigation";
import { createLogger } from "../../../utils/optimizedLogger";
import { useCustomAlert } from "../../ui/CustomAlert";
import { LoginHookReturn } from "../types";
import { useLoginValidation } from "./useLoginValidation";

const logger = createLogger("LoginLogic");

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

export function useLoginLogic(): LoginHookReturn & {
  AlertComponent: () => React.JSX.Element;
} {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { t } = useTranslation();
  const { signIn, error: authError } = useAuth();
  const { showAlert, AlertComponent } = useCustomAlert();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const {
    emailError,
    passwordError,
    emailWarning,
    emailSuggestions,
    showSuggestionAlert,
    validateEmail,
    validatePassword,
    clearEmailError,
    clearPasswordError,
    dismissSuggestionAlert,
  } = useLoginValidation();

  // Fonction pour gérer le changement d'email
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Effacer l'erreur si l'utilisateur tape
    if (emailError) {
      clearEmailError();
    }
  };

  // Fonction pour gérer le changement de mot de passe
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Effacer l'erreur si l'utilisateur tape
    if (passwordError) {
      clearPasswordError();
    }
  };

  // Load saved email on mount
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("@last_email");
        if (savedEmail) {
          setEmail(savedEmail);
          logger.info("📧 Email pre-filled:", savedEmail);
        }
      } catch (error) {
        logger.error("Error loading email:", error);
      }
    };

    loadSavedEmail();
  }, []);

  const handleSuccessfulLogin = async () => {
    try {
      // Sauvegarder l'email pour la prochaine fois
      await AsyncStorage.setItem("@last_email", email);
      logger.info("✅ Connexion réussie");

      // Naviguer vers l'écran d'accueil
      navigation.navigate("Home");
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert({
        type: "warning",
        title: t("login.error"),
        message: t("login.fillAllFields", "Veuillez remplir tous les champs"),
        buttons: [{ text: t("common.ok") }],
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await signIn(email, password);

      if (success) {
        // Afficher l'alerte de succès avec un délai plus long
        showAlert({
          type: "success",
          title: t("login.success", "Connexion réussie"),
          message: t("login.welcomeBack", "Bienvenue !"),
          buttons: [
            {
              text: t("common.continue", "Continuer"),
              onPress: async () => {
                // Attendre un peu avant la navigation
                await new Promise((resolve) => setTimeout(resolve, 500));
                await handleSuccessfulLogin();
              },
            },
          ],
        });
      }
    } catch (error: any) {
      // Gestion des erreurs non prévues
      showAlert({
        type: "error",
        title: t("login.error", "Erreur de connexion"),
        message: t(
          "login.unexpectedError",
          "Une erreur inattendue s'est produite. Veuillez réessayer."
        ),
        buttons: [
          {
            text: t("common.ok"),
            style: "cancel",
          },
        ],
        dismissOnBackdropPress: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Surveiller les erreurs du contexte Auth
  useEffect(() => {
    if (authError && !isLoading) {
      // Afficher l'erreur spécifique du contexte
      let errorTitle = t("login.error", "Erreur de connexion");
      const errorMessage = authError;

      // Personnaliser le titre selon le type d'erreur
      if (authError.includes("invalide")) {
        errorTitle = t("login.invalidCredentials", "Identifiants invalides");
      } else if (authError.includes("trouvé")) {
        errorTitle = t("login.accountNotFound", "Compte introuvable");
      } else if (authError.includes("incorrect")) {
        errorTitle = t("login.incorrectPassword", "Mot de passe incorrect");
      } else if (authError.includes("désactivé")) {
        errorTitle = t("login.accountDisabled", "Compte désactivé");
      } else if (authError.includes("réseau")) {
        errorTitle = t("login.networkError", "Erreur réseau");
      }

      showAlert({
        type: "error",
        title: errorTitle,
        message: errorMessage,
        buttons: [
          {
            text: t("common.ok"),
            style: "cancel",
          },
        ],
        dismissOnBackdropPress: false,
      });
    }
  }, [authError, isLoading]);

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleEmailSuggestionSelect = (suggestion: string) => {
    setEmail(suggestion);
    clearEmailError();
  };

  return {
    // Login logic
    handleLogin,
    handleForgotPassword,
    isLoading,

    // Form data
    email,
    password,
    setEmail: handleEmailChange,
    setPassword: handlePasswordChange,
    isPasswordVisible,
    setIsPasswordVisible,

    // Validation
    emailError,
    passwordError,
    emailWarning,
    emailSuggestions,
    showSuggestionAlert,
    validateEmail,
    validatePassword,
    handleEmailSuggestionSelect,
    dismissSuggestionAlert,

    // Alert component
    AlertComponent,
  };
}
