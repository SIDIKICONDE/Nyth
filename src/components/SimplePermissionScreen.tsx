import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../contexts/ThemeContext";
import { useSimplePermissions } from "../hooks/useSimplePermissions";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('SimplePermissionScreen');

interface SimplePermissionScreenProps {
  onPermissionsGranted?: () => void;
}

export const SimplePermissionScreen: React.FC<SimplePermissionScreenProps> = ({
  onPermissionsGranted,
}) => {
  const { currentTheme } = useTheme();
  const {
    permissions,
    requestPermissions,
    openSettings,
    needsPermission,
    checkPermissions,
  } = useSimplePermissions();

  const [isRequesting, setIsRequesting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasCheckedInitially, setHasCheckedInitially] = useState(false);

  // Vérifier les permissions une seule fois au montage de cet écran
  useEffect(() => {
    if (!hasCheckedInitially) {
      logger.debug(
        "🔍 Première vérification des permissions pour l'écran d'enregistrement"
      );
      checkPermissions()
        .then(() => {
          setHasCheckedInitially(true);
        })
        .catch((error) => {
          logger.error("❌ Erreur vérification initiale permissions:", error);
          setHasError(true);
          setHasCheckedInitially(true);
        });
    }
  }, [hasCheckedInitially]); // Supprimé checkPermissions des dépendances

  // Si les permissions sont accordées, appeler le callback
  React.useEffect(() => {
    try {
      if (permissions.isReady && onPermissionsGranted && hasCheckedInitially) {
        logger.debug("✅ Permissions accordées, callback appelé");
        onPermissionsGranted();
      }
    } catch (error) {
      logger.error("❌ Erreur dans le callback de permissions:", error);
      setHasError(true);
    }
  }, [permissions.isReady, onPermissionsGranted, hasCheckedInitially]);

  // Si les permissions sont accordées, ne pas afficher l'écran
  if (permissions.isReady && !hasError && hasCheckedInitially) {
    return null;
  }

  // Afficher un indicateur de chargement pendant la vérification
  if ((permissions.isLoading || !hasCheckedInitially) && !hasError) {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={[tw`text-lg mt-4`, { color: currentTheme.colors.text }]}>
          Vérification des permissions...
        </Text>
      </View>
    );
  }

  const handleRequestPermissions = async () => {
    try {
      setIsRequesting(true);
      setHasError(false);
      logger.debug("🔐 Demande de permissions initiée par l'utilisateur");

      const granted = await requestPermissions();

      if (granted) {
        logger.debug("✅ Permissions accordées par l'utilisateur");
        // Le callback sera appelé automatiquement par l'effet useEffect
      } else {
        logger.debug("❌ Permissions refusées par l'utilisateur");
        setHasError(true);
      }
    } catch (error) {
      logger.error("❌ Erreur lors de la demande de permissions:", error);
      setHasError(true);
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite lors de la demande de permissions. Veuillez réessayer ou aller dans les paramètres.",
        [
          { text: "Réessayer", onPress: () => setHasError(false) },
          { text: "Paramètres", onPress: openSettings },
        ]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    try {
      logger.debug("🔧 Ouverture des paramètres demandée par l'utilisateur");
      openSettings();
    } catch (error) {
      logger.error("❌ Erreur ouverture paramètres:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir les paramètres automatiquement. Veuillez ouvrir manuellement : Paramètres > Applications > CamPrompt AI > Permissions"
      );
    }
  };

  // Gérer les permissions non disponibles
  if (permissions.camera === "denied" || permissions.microphone === "denied") {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center px-6`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        {/* Icône d'erreur */}
        <View
          style={[
            tw`w-20 h-20 rounded-full items-center justify-center mb-8`,
            { backgroundColor: "#DC2626" },
          ]}
        >
          <Text style={[tw`text-3xl`, { color: "white" }]}>⚠️</Text>
        </View>

        <Text
          style={[
            tw`text-2xl font-bold text-center mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          Système non compatible
        </Text>

        <Text
          style={[
            tw`text-base text-center mb-8 leading-6`,
            { color: currentTheme.colors.text },
          ]}
        >
          Votre appareil ne semble pas prendre en charge les fonctionnalités de
          caméra et microphone requises pour cette application.
        </Text>

        <TouchableOpacity
          style={[
            tw`px-8 py-4 rounded-full`,
            { backgroundColor: currentTheme.colors.primary },
          ]}
          onPress={() => setHasError(false)}
        >
          <Text style={[tw`text-white font-semibold text-lg`]}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        tw`flex-1 items-center justify-center px-6`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      {/* Icône */}
      <View
        style={[
          tw`w-20 h-20 rounded-full items-center justify-center mb-8`,
          {
            backgroundColor: hasError ? "#DC2626" : currentTheme.colors.primary,
          },
        ]}
      >
        <Text
          style={[
            tw`text-3xl`,
            { color: hasError ? "white" : currentTheme.colors.background },
          ]}
        >
          {hasError ? "❌" : "📹"}
        </Text>
      </View>

      {/* Titre */}
      <Text
        style={[
          tw`text-2xl font-bold text-center mb-4`,
          { color: currentTheme.colors.text },
        ]}
      >
        {hasError ? "Erreur de permissions" : "Permissions requises"}
      </Text>

      {/* Description */}
      <Text
        style={[
          tw`text-base text-center mb-8 leading-6`,
          { color: currentTheme.colors.text },
        ]}
      >
        {hasError
          ? "Il y a eu un problème avec les permissions. Vous pouvez réessayer ou aller dans les paramètres pour les activer manuellement."
          : "Cette application a besoin d'accéder à votre caméra et microphone pour enregistrer des vidéos."}
      </Text>

      {/* État des permissions */}
      <View style={tw`w-full mb-8`}>
        <PermissionRow
          label="Caméra"
          status={permissions.camera}
          icon="📷"
          theme={currentTheme}
        />
        <PermissionRow
          label="Microphone"
          status={permissions.microphone}
          icon="🎤"
          theme={currentTheme}
        />
        {Platform.OS === "android" && (
          <PermissionRow
            label="Stockage"
            status={permissions.storage}
            icon="💾"
            theme={currentTheme}
          />
        )}
      </View>

      {/* Boutons */}
      <View style={tw`w-full`}>
        {hasError ? (
          <View style={tw`flex-col gap-4`}>
            <TouchableOpacity
              style={[
                tw`py-4 px-8 rounded-full`,
                { backgroundColor: currentTheme.colors.primary },
              ]}
              onPress={handleRequestPermissions}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={[tw`text-white font-semibold text-lg text-center`]}
                >
                  Réessayer
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`py-4 px-8 rounded-full border-2`,
                {
                  borderColor: currentTheme.colors.primary,
                  backgroundColor: "transparent",
                },
              ]}
              onPress={handleOpenSettings}
            >
              <Text
                style={[
                  tw`font-semibold text-lg text-center`,
                  { color: currentTheme.colors.primary },
                ]}
              >
                Ouvrir les paramètres
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              tw`py-4 px-8 rounded-full`,
              { backgroundColor: currentTheme.colors.primary },
            ]}
            onPress={handleRequestPermissions}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[tw`text-white font-semibold text-lg text-center`]}>
                🔓 Autoriser l'Accès
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Composant pour afficher l'état d'une permission individuelle
const PermissionRow: React.FC<{
  label: string;
  status: string;
  icon: string;
  theme: {
    colors: {
      surface: string;
      text: string;
    };
  };
}> = ({ label, status, icon, theme }) => {
  const getStatusColor = () => {
    switch (status) {
      case "granted":
        return "#10B981"; // Vert
      case "denied":
        return "#DC2626"; // Rouge
      case "unavailable":
        return "#6B7280"; // Gris
      default:
        return "#F59E0B"; // Orange pour "not-determined"
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "granted":
        return "✅ Accordée";
      case "denied":
        return "❌ Refusée";
      case "unavailable":
        return "⚠️ Non disponible";
      default:
        return "⏳ En attente";
    }
  };

  return (
    <View
      style={[
        tw`flex-row items-center justify-between py-3 px-4 mb-2 rounded-lg`,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={tw`flex-row items-center`}>
        <Text style={tw`text-lg mr-3`}>{icon}</Text>
        <Text style={[tw`text-base font-medium`, { color: theme.colors.text }]}>
          {label}
        </Text>
      </View>
      <Text style={[tw`text-sm font-semibold`, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </View>
  );
};
