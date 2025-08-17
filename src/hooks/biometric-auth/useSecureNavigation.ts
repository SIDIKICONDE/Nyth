import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import { checkHasAnyApiKey } from "../../utils/checkApiKeys";
import { createLogger } from "../../utils/optimizedLogger";
import { useTranslation } from "../useTranslation";
import { useBiometricAuth } from "./useBiometricAuth";

const logger = createLogger("SecureNavigation");

export const useSecureNavigation = () => {
  // Toujours appeler useNavigation (règle des hooks)
  const navigation = useNavigation();

  const { t } = useTranslation();
  const {
    requireAuthForSettings,
    isSupported,
    isEnrolled,
    settings: biometricSettings,
  } = useBiometricAuth();

  const navigateToAISettings = async () => {
    try {
      // Vérifier d'abord s'il y a des clés API à protéger
      const hasApiKeys = await checkHasAnyApiKey();

      // Vérifier si la protection biométrique est requise pour les paramètres
      // La protection ne s'applique que s'il y a des clés API configurées
      const needsAuth =
        hasApiKeys &&
        biometricSettings.enabled &&
        biometricSettings.requiredForSettings &&
        isSupported &&
        isEnrolled;

      logger.info("Navigation vers AISettings - Auth requise:", {
        needsAuth,
        hasApiKeys,
      });

      if (needsAuth) {
        // Demander l'authentification AVANT de naviguer
        const authenticated = await requireAuthForSettings();

        if (!authenticated) {
          // Afficher l'alerte si l'authentification échoue
          Alert.alert(
            t("biometric.accessDenied.title", "🔒 Accès Refusé"),
            t(
              "biometric.accessDenied.message",
              "Authentification requise pour accéder aux paramètres AI"
            ),
            [
              {
                text: t("common.ok"),
                style: "default",
              },
            ]
          );
          return false; // Navigation bloquée
        }
      }

      // Navigation autorisée
      if (navigation && typeof navigation.navigate === "function") {
        navigation.navigate("AISettings" as never);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      logger.error("Erreur lors de la navigation sécurisée:", error);

      Alert.alert(
        t("common.error"),
        t("biometric.authError", "Erreur lors de l'authentification"),
        [
          {
            text: t("common.ok"),
            style: "default",
          },
        ]
      );

      return false;
    }
  };

  return {
    navigateToAISettings,
  };
};
