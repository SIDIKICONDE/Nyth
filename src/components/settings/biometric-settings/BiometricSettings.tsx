import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useRef, useCallback } from "react";
import {
  Alert,
  Text,
  View,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useBiometricAuth } from "../../../hooks/useBiometricAuth";
import { useTranslation } from "../../../hooks/useTranslation";
import { checkHasAnyApiKey } from "../../../utils/checkApiKeys";
import ReactNativeBiometrics from "react-native-biometrics";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('BiometricSettings');

// Sous-composants
import { BiometricHeader } from "./BiometricHeader";
import { BiometricOption } from "./BiometricOption";
import { InfoCard } from "./InfoCard";
import { NotSupportedView } from "./NotSupportedView";
import { UpdateKey } from "./types";

// Fonction d'authentification native React Native
// Supprimer la fonction performNativeAuthentication simulée

export const BiometricSettings: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    isSupported,
    isEnrolled,
    isEnabled,
    settings,
    toggleBiometric,
    updateRequirements,
    loadSettings,
  } = useBiometricAuth();

  // États locaux pour gérer le chargement
  const [isUpdating, setIsUpdating] = React.useState<UpdateKey>(null);
  const [hasApiKeys, setHasApiKeys] = React.useState(false);
  const [isCheckingKeys, setIsCheckingKeys] = React.useState(true);
  // Recharger les paramètres au montage et vérifier les clés API
  useEffect(() => {
    const init = async () => {
      setIsCheckingKeys(true);
      await loadSettings();
      const hasKeys = await checkHasAnyApiKey();
      setHasApiKeys(hasKeys);
      setIsCheckingKeys(false);
    };
    init();
  }, []);

  // Fonction partagée pour (re)vérifier la présence des clés API
  const refreshApiKeys = useCallback(async () => {
    const hasKeys = await checkHasAnyApiKey();
    setHasApiKeys((prev) => (prev !== hasKeys ? hasKeys : prev));
  }, []);

  // Écouter les transitions d'état de l'app pour recharger les clés API
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        refreshApiKeys();
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshApiKeys]);

  useFocusEffect(
    React.useCallback(() => {
      refreshApiKeys();
    }, [refreshApiKeys])
  );

  const handleToggleEnabled = async (value: boolean) => {
    // Vérifier d'abord s'il y a des clés API
    if (value && !hasApiKeys) {
      Alert.alert(
        t("biometric.noApiKeys.title", "🔑 Aucune clé API"),
        t(
          "biometric.noApiKeys.message",
          "Vous devez d'abord configurer au moins une clé API avant d'activer la protection biométrique."
        ),
        [
          {
            text: t("common.cancel"),
            style: "cancel",
          },
          {
            text: t("biometric.noApiKeys.configure", "Configurer"),
            onPress: () => {
              // Navigation vers les paramètres AI est déjà gérée par le bouton retour
            },
          },
        ]
      );
      return;
    }

    if (value && !isEnrolled) {
      Alert.alert(
        t("biometric.notEnrolled.title", "Biométrie non configurée"),
        t(
          "biometric.notEnrolled.message",
          "Veuillez configurer Face ID/Touch ID dans les paramètres de votre appareil."
        ),
        [{ text: t("common.ok") }]
      );
      return;
    }

    setIsUpdating("main");

    if (value) {
      // Test d'authentification avant d'activer
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: t(
            "biometric.enablePrompt",
            "Authentifiez-vous pour activer la protection biométrique"
          ),
        });
        if (!success) {
          setIsUpdating(null);
          return;
        }
      } catch (error) {
        logger.error("Erreur authentification:", error);
        setIsUpdating(null);
        return;
      }
    }

    const success = await toggleBiometric(value);
    if (!success && value) {
      Alert.alert(
        t("common.error"),
        t("biometric.enableError", "Impossible d'activer la biométrie"),
        [{ text: t("common.ok") }]
      );
    }

    // Recharger les paramètres après modification
    await loadSettings();
    setIsUpdating(null);
  };

  const handleToggleOption = async (
    key: "requiredForApiKeys" | "requiredForSettings",
    value: boolean
  ) => {
    setIsUpdating(key);
    await updateRequirements({ [key]: value });
    // Recharger les paramètres pour s'assurer que l'UI est synchronisée
    await loadSettings();
    setIsUpdating(null);
  };

  // Si la biométrie n'est pas supportée
  if (!isSupported) {
    return <NotSupportedView />;
  }

  // Si on vérifie encore les clés API
  if (isCheckingKeys) {
    return (
      <View style={tw`p-4 items-center justify-center`}>
        <Text style={[tw`text-base`, { color: currentTheme.colors.text }]}>
          {t("common.loading")}...
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={tw`p-4`}>
      {/* Message d'avertissement si pas de clés API */}
      {!hasApiKeys && (
        <InfoCard
          type="warning"
          title={t(
            "biometric.noApiKeys.warning",
            "⚠️ Aucune clé API configurée"
          )}
          message={t(
            "biometric.noApiKeys.warningMessage",
            "Configurez au moins une clé API avant d'activer la protection biométrique."
          )}
          delay={0}
        />
      )}

      {/* En-tête principal */}
      <BiometricHeader
        isEnabled={isEnabled}
        isEnrolled={isEnrolled}
        isUpdating={isUpdating}
        onToggle={handleToggleEnabled}
        disabled={!hasApiKeys}
      />

      {/* Options détaillées avec animations */}
      {isEnabled && hasApiKeys && (
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          layout={Layout.springify()}
          style={tw`mt-4`}
        >
          {/* Option: Protection des clés API */}
          <View style={tw`mb-3`}>
            <BiometricOption
              icon="key-variant"
              iconColor={currentTheme.colors.primary}
              title={t("biometric.requireForApiKeys", "Clés API")}
              description={t(
                "biometric.requireForApiKeysDesc",
                "Protéger l'accès aux clés API"
              )}
              value={settings.requiredForApiKeys || false}
              onValueChange={(value) =>
                handleToggleOption("requiredForApiKeys", value)
              }
              disabled={isUpdating === "requiredForApiKeys"}
              isActive={settings.requiredForApiKeys}
            />
          </View>

          {/* Option: Protection des paramètres */}
          <BiometricOption
            icon="cog-outline"
            iconColor={currentTheme.colors.primary}
            title={t("biometric.requireForSettings", "Paramètres AI")}
            description={t(
              "biometric.requireForSettingsDesc",
              "Sécuriser l'accès aux paramètres"
            )}
            value={settings.requiredForSettings || false}
            onValueChange={(value) =>
              handleToggleOption("requiredForSettings", value)
            }
            disabled={isUpdating === "requiredForSettings"}
            isActive={settings.requiredForSettings}
          />
        </Animated.View>
      )}

      {/* Information sur la configuration requise */}
      {!isEnrolled && (
        <InfoCard
          type="warning"
          title={t("biometric.setupRequired", "Configuration requise")}
          message={t(
            "biometric.setupRequiredDesc",
            "Pour utiliser cette fonctionnalité, configurez Face ID ou Touch ID dans Réglages > Face ID & Code"
          )}
          delay={200}
        />
      )}

      {/* Carte d'information sur la sécurité */}
      {isEnabled && (
        <InfoCard
          type="security"
          message={t(
            "biometric.securityInfo",
            "Vos données biométriques restent sur votre appareil et ne sont jamais partagées."
          )}
          description={t(
            "biometric.authValidity",
            "Authentification valide pendant 5 minutes"
          )}
          delay={300}
        />
      )}

      {/* Nouvelle carte d'information sur le fonctionnement */}
      {isEnabled && isEnrolled && (
        <InfoCard
          type="info"
          title="💡 Comment ça marche"
          message="Face ID s'affiche en premier. Si vous préférez utiliser votre code, appuyez sur 'Entrer le code' pour passer au clavier."
          delay={400}
        />
      )}
    </Animated.View>
  );
};
