import React from "react";
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import NetInfo from "@react-native-community/netinfo";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('NetworkErrorAlert');

interface NetworkErrorAlertProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error?: any;
  title?: string;
}

export const NetworkErrorAlert: React.FC<NetworkErrorAlertProps> = ({
  visible,
  onClose,
  onRetry,
  error,
  title = "Erreur de connexion",
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [isRunningDiagnostic, setIsRunningDiagnostic] = React.useState(false);
  const [diagnosticResult, setDiagnosticResult] = React.useState<any>(null);
  const [isRecovering, setIsRecovering] = React.useState(false);

  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const netInfo = await NetInfo.fetch();
      const result = {
        isConnected: netInfo.isConnected && netInfo.isInternetReachable,
        canReachFirebase: netInfo.isConnected,
        recommendations: netInfo.isConnected
          ? ["Connexion réseau détectée", "Problème possible avec les serveurs"]
          : [
              "Vérifier la connexion internet",
              "Réessayer dans quelques instants",
            ],
      };
      setDiagnosticResult(result);
    } catch (error) {
      logger.error("Erreur diagnostic:", error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const attemptRecovery = async () => {
    setIsRecovering(true);
    try {
      // Attendre un court moment puis vérifier la connectivité
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const netInfo = await NetInfo.fetch();
      const recovered = netInfo.isConnected && netInfo.isInternetReachable;

      if (recovered && onRetry) {
        onRetry();
        onClose();
      } else {
        Alert.alert(
          "Récupération impossible",
          "La connexion ne peut pas être rétablie automatiquement. Vérifiez votre réseau et réessayez manuellement.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      logger.error("Erreur récupération:", error);
    } finally {
      setIsRecovering(false);
    }
  };

  const showSimpleAlert = () => {
    Alert.alert(
      title,
      "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.",
      [
        { text: "Annuler", style: "cancel", onPress: onClose },
        { text: "Diagnostic", onPress: runDiagnostic },
        { text: "Réessayer", onPress: onRetry },
      ]
    );
  };

  // Si on n'est pas en mode modal ou pas d'erreur spécifique, utiliser l'alerte simple
  if (!visible || !error) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          tw`flex-1 bg-black bg-opacity-50 justify-center items-center px-4`,
        ]}
      >
        <View
          style={[
            tw`bg-white rounded-2xl p-6 w-full max-w-sm`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          {/* Header */}
          <View style={tw`items-center mb-4`}>
            <View
              style={[
                tw`w-16 h-16 rounded-full items-center justify-center mb-3`,
                { backgroundColor: currentTheme.colors.error + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="wifi-off"
                size={32}
                color={currentTheme.colors.error}
              />
            </View>
            <Text
              style={[
                tw`text-xl font-bold text-center`,
                { color: currentTheme.colors.text },
              ]}
            >
              {title}
            </Text>
          </View>

          {/* Message d'erreur */}
          <Text
            style={[
              tw`text-center mb-6`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            Un problème de connexion réseau empêche l'accès aux services.
          </Text>

          {/* Diagnostic en cours */}
          {isRunningDiagnostic && (
            <View style={tw`items-center mb-4`}>
              <ActivityIndicator
                size="small"
                color={currentTheme.colors.primary}
              />
              <Text
                style={[
                  tw`text-sm mt-2`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Diagnostic en cours...
              </Text>
            </View>
          )}

          {/* Résultats du diagnostic */}
          {diagnosticResult && !isRunningDiagnostic && (
            <ScrollView style={tw`max-h-40 mb-4`}>
              <View
                style={[
                  tw`p-3 rounded-lg`,
                  { backgroundColor: currentTheme.colors.background },
                ]}
              >
                <Text
                  style={[
                    tw`text-sm font-medium mb-2`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  État de la connexion:
                </Text>

                <View style={tw`flex-row items-center mb-1`}>
                  <MaterialCommunityIcons
                    name={diagnosticResult.isConnected ? "check" : "close"}
                    size={16}
                    color={diagnosticResult.isConnected ? "#10B981" : "#EF4444"}
                  />
                  <Text
                    style={[
                      tw`text-xs ml-2`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    Internet:{" "}
                    {diagnosticResult.isConnected ? "Connecté" : "Déconnecté"}
                  </Text>
                </View>

                <View style={tw`flex-row items-center mb-1`}>
                  <MaterialCommunityIcons
                    name={
                      diagnosticResult.firebaseReachable ? "check" : "close"
                    }
                    size={16}
                    color={
                      diagnosticResult.firebaseReachable ? "#10B981" : "#EF4444"
                    }
                  />
                  <Text
                    style={[
                      tw`text-xs ml-2`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    Firebase:{" "}
                    {diagnosticResult.firebaseReachable
                      ? "Accessible"
                      : "Inaccessible"}
                  </Text>
                </View>

                {diagnosticResult.recommendations.length > 0 && (
                  <View style={tw`mt-2`}>
                    <Text
                      style={[
                        tw`text-xs font-medium mb-1`,
                        { color: currentTheme.colors.text },
                      ]}
                    >
                      Recommandations:
                    </Text>
                    {diagnosticResult.recommendations
                      .slice(0, 3)
                      .map((rec: string, index: number) => (
                        <Text
                          key={index}
                          style={[
                            tw`text-xs ml-2`,
                            { color: currentTheme.colors.textSecondary },
                          ]}
                        >
                          • {rec}
                        </Text>
                      ))}
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Actions */}
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                tw`flex-1 py-3 rounded-xl border`,
                { borderColor: currentTheme.colors.border },
              ]}
            >
              <Text
                style={[
                  tw`text-center font-medium`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Fermer
              </Text>
            </TouchableOpacity>

            {!diagnosticResult && (
              <TouchableOpacity
                onPress={runDiagnostic}
                disabled={isRunningDiagnostic}
                style={[
                  tw`flex-1 py-3 rounded-xl`,
                  { backgroundColor: currentTheme.colors.secondary },
                ]}
              >
                <Text style={tw`text-white text-center font-medium`}>
                  Diagnostic
                </Text>
              </TouchableOpacity>
            )}

            {diagnosticResult && diagnosticResult.canRetry && (
              <TouchableOpacity
                onPress={attemptRecovery}
                disabled={isRecovering}
                style={[
                  tw`flex-1 py-3 rounded-xl flex-row items-center justify-center`,
                  { backgroundColor: currentTheme.colors.primary },
                ]}
              >
                {isRecovering ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="refresh"
                      size={16}
                      color="white"
                      style={tw`mr-1`}
                    />
                    <Text style={tw`text-white font-medium`}>Récupérer</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {onRetry && (
              <TouchableOpacity
                onPress={onRetry}
                style={[
                  tw`flex-1 py-3 rounded-xl`,
                  { backgroundColor: currentTheme.colors.primary },
                ]}
              >
                <Text style={tw`text-white text-center font-medium`}>
                  Réessayer
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Hook pour utiliser facilement l'alerte réseau
export const useNetworkErrorAlert = () => {
  const [alertState, setAlertState] = React.useState({
    visible: false,
    error: null,
    onRetry: undefined as (() => void) | undefined,
    title: "Erreur de connexion",
  });

  const showNetworkError = (
    error: any,
    onRetry?: () => void,
    title?: string
  ) => {
    setAlertState({
      visible: true,
      error,
      onRetry,
      title: title || "Erreur de connexion",
    });
  };

  const hideNetworkError = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const NetworkErrorComponent = () => (
    <NetworkErrorAlert
      visible={alertState.visible}
      onClose={hideNetworkError}
      onRetry={alertState.onRetry}
      error={alertState.error}
      title={alertState.title}
    />
  );

  return {
    showNetworkError,
    hideNetworkError,
    NetworkErrorComponent,
  };
};
